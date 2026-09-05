import { Refund, RefundStatus } from '@/types';
import { supabaseAdmin } from './supabase-admin';

/**
 * Data access for tables that only the admin console and payment webhooks touch.
 *
 * These go through the service-role client so `refunds` and
 * `processed_webhook_events` can keep RLS enabled with *no* public policies -
 * unlike products/orders/chats, they should not be world-writable just to work.
 *
 * Server-only by construction: lib/supabase-admin.ts throws if imported in a
 * browser bundle.
 */

// Demo fallback, so the refunds console is still usable without a service-role
// key. Pinned to globalThis for the same reason as lib/db.ts's arrays.
const memory = globalThis as any;
const inMemoryRefunds: Refund[] = (memory.__agrox_refunds ??= []);
const inMemoryWebhookEvents: Set<string> = (memory.__agrox_webhook_events ??= new Set<string>());

/**
 * Runs a privileged query, falling back to the in-memory store when the database
 * is unreachable.
 *
 * supabase-js reports network failures through `error` rather than throwing, so
 * a Postgres/PostgREST error code is what distinguishes a rejected write (which
 * must surface) from an outage (which should degrade). Mirrors the same helper
 * in lib/db.ts.
 */
function isConnectivityFailure(error: any): boolean {
  if (!error) return false;
  if (error.code) return false;
  return /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket/i.test(
    String(error.message || error)
  );
}

async function tryAdminDb<T>(
  run: () => PromiseLike<{ data: any; error: any }>,
  map: (data: any) => T
): Promise<{ ok: true; value: T } | { ok: false }> {
  if (!supabaseAdmin) return { ok: false };
  try {
    const { data, error } = await run();
    if (error) {
      if (isConnectivityFailure(error)) return { ok: false };
      throw new Error(error.message);
    }
    return { ok: true, value: map(data) };
  } catch (e: any) {
    if (isConnectivityFailure(e)) return { ok: false };
    // A genuine rejection (constraint violation, bad column) must not be
    // silently written to memory as if it had succeeded.
    throw e;
  }
}

function mapDbRefund(row: any): Refund {
  return {
    id: row.id,
    orderId: row.order_id,
    orderReference: row.order_reference,
    paystackReference: row.paystack_reference || undefined,
    amount: Number(row.amount),
    reason: row.reason || '',
    status: row.status,
    paystackRefundId: row.paystack_refund_id || undefined,
    adminNote: row.admin_note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export async function getRefunds(): Promise<Refund[]> {
  const result = await tryAdminDb(
    () => supabaseAdmin!.from('refunds').select('*').order('created_at', { ascending: false }),
    (data): Refund[] => (data || []).map(mapDbRefund)
  );
  if (result.ok) return result.value;
  return [...inMemoryRefunds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRefundsForOrder(orderReference: string): Promise<Refund[]> {
  const all = await getRefunds();
  return all.filter((r) => r.orderReference === orderReference);
}

export async function createRefund(
  input: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Refund> {
  const now = new Date().toISOString();
  const refund: Refund = {
    ...input,
    id: `rf-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: now,
    updatedAt: now,
  };

  const result = await tryAdminDb(
    () =>
      supabaseAdmin!
        .from('refunds')
        .insert([
          {
            id: refund.id,
            order_id: refund.orderId,
            order_reference: refund.orderReference,
            paystack_reference: refund.paystackReference || null,
            amount: refund.amount,
            reason: refund.reason,
            status: refund.status,
            paystack_refund_id: refund.paystackRefundId || null,
            admin_note: refund.adminNote || null,
          },
        ])
        .select()
        .single(),
    mapDbRefund
  );
  if (result.ok) return result.value;

  inMemoryRefunds.unshift(refund);
  return refund;
}

export async function updateRefund(
  id: string,
  patch: Partial<Pick<Refund, 'status' | 'paystackRefundId' | 'adminNote'>>
): Promise<Refund | null> {
  const now = new Date().toISOString();

  const row: Record<string, any> = { updated_at: now };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paystackRefundId !== undefined) row.paystack_refund_id = patch.paystackRefundId;
  if (patch.adminNote !== undefined) row.admin_note = patch.adminNote;

  const result = await tryAdminDb(
    () => supabaseAdmin!.from('refunds').update(row).eq('id', id).select().maybeSingle(),
    (data): Refund | null => (data ? mapDbRefund(data) : null)
  );
  if (result.ok && result.value) return result.value;

  const target = inMemoryRefunds.find((r) => r.id === id);
  if (!target) return null;
  Object.assign(target, patch, { updatedAt: now });
  return target;
}

/** Reconciliation path: Paystack refund webhooks identify the refund by its own id. */
export async function updateRefundByPaystackId(
  paystackRefundId: string,
  status: RefundStatus
): Promise<Refund | null> {
  const result = await tryAdminDb(
    () =>
      supabaseAdmin!
        .from('refunds')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('paystack_refund_id', paystackRefundId)
        .select()
        .maybeSingle(),
    (data): Refund | null => (data ? mapDbRefund(data) : null)
  );
  if (result.ok && result.value) return result.value;

  const target = inMemoryRefunds.find((r) => r.paystackRefundId === paystackRefundId);
  if (!target) return null;
  target.status = status;
  target.updatedAt = new Date().toISOString();
  return target;
}

/* WEBHOOK IDEMPOTENCY */

/**
 * Paystack retries webhooks, and a retry must not re-apply a transition.
 * Claiming the event id up front (insert, treat a unique violation as "already
 * seen") makes the check atomic rather than a read-then-write race.
 * Returns true when this caller owns the event and should process it.
 */
export async function claimWebhookEvent(eventId: string): Promise<boolean> {
  if (!eventId) return true; // Nothing to dedupe on; let the handler's own guards apply.

  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('processed_webhook_events')
        .insert([{ event_id: eventId }]);

      if (!error) return true;
      // 23505 = unique_violation: another delivery already claimed it.
      if ((error as any).code === '23505') return false;
      if (!isConnectivityFailure(error)) {
        console.warn('Webhook idempotency check failed, processing anyway:', error.message);
        return true;
      }
    } catch {
      // Fall through to the in-memory guard.
    }
  }

  if (inMemoryWebhookEvents.has(eventId)) return false;
  inMemoryWebhookEvents.add(eventId);
  return true;
}
