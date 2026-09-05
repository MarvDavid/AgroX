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

/** Thrown when the privileged client is unavailable. Routes map this to 503. */
export class AdminDatabaseUnavailableError extends Error {
  readonly code = 'ADMIN_DATABASE_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'AdminDatabaseUnavailableError';
  }
}

function client() {
  if (!supabaseAdmin) {
    throw new AdminDatabaseUnavailableError(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Refunds and webhook de-duplication need it, because those tables have no public RLS policies.'
    );
  }
  return supabaseAdmin;
}

/**
 * supabase-js reports network failures through `error` rather than throwing, so
 * a Postgres/PostgREST error code is what distinguishes a rejected write from an
 * outage. Mirrors the same helper in lib/db.ts.
 */
function isConnectivityFailure(error: any): boolean {
  if (!error) return false;
  if (error.code) return false;
  return /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket/i.test(
    String(error.message || error)
  );
}

function raise(error: any, action: string): never {
  if (isConnectivityFailure(error)) {
    throw new AdminDatabaseUnavailableError(
      `Could not reach the database while trying to ${action}.`
    );
  }
  throw new Error(`Could not ${action}: ${error?.message || 'unknown database error'}`);
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
  const { data, error } = await client()
    .from('refunds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) raise(error, 'load refunds');
  return (data || []).map(mapDbRefund);
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

  const { data, error } = await client()
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
    .single();

  if (error) raise(error, 'record refund');
  return mapDbRefund(data);
}

export async function updateRefund(
  id: string,
  patch: Partial<Pick<Refund, 'status' | 'paystackRefundId' | 'adminNote'>>
): Promise<Refund | null> {
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paystackRefundId !== undefined) row.paystack_refund_id = patch.paystackRefundId;
  if (patch.adminNote !== undefined) row.admin_note = patch.adminNote;

  const { data, error } = await client()
    .from('refunds')
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) raise(error, 'update refund');
  return data ? mapDbRefund(data) : null;
}

/** Reconciliation path: Paystack refund webhooks identify the refund by its own id. */
export async function updateRefundByPaystackId(
  paystackRefundId: string,
  status: RefundStatus
): Promise<Refund | null> {
  const { data, error } = await client()
    .from('refunds')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('paystack_refund_id', paystackRefundId)
    .select()
    .maybeSingle();

  if (error) raise(error, 'reconcile refund');
  return data ? mapDbRefund(data) : null;
}

/* WEBHOOK IDEMPOTENCY */

/**
 * Paystack retries webhooks, and a retry must not re-apply a transition.
 * Claiming the event id up front (insert, treat a unique violation as "already
 * seen") makes the check atomic rather than a read-then-write race.
 * Returns true when this caller owns the event and should process it.
 */
export async function claimWebhookEvent(eventId: string): Promise<boolean> {
  if (!eventId) return true; // Nothing to dedupe on; the handler's own guards apply.

  const { error } = await client()
    .from('processed_webhook_events')
    .insert([{ event_id: eventId }]);

  if (!error) return true;
  // 23505 = unique_violation: another delivery already claimed it.
  if ((error as any).code === '23505') return false;

  // Any other failure must not silently drop the event: process it and let the
  // conditional status transition provide the safety net.
  console.warn('Webhook idempotency check failed, processing anyway:', error.message);
  return true;
}
