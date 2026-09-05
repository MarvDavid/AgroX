/**
 * Paystack integration boundary.
 *
 * The central rule here is that there are exactly three states and no
 * fallthrough between them:
 *
 *   live         - a real secret key is present; real calls, real errors.
 *   sandbox      - PAYSTACK_SANDBOX_MODE=true; simulated, clearly labelled.
 *   unconfigured - neither; every payment route returns 503.
 *
 * This matters because a truthy-but-junk key ("sk_test_placeholder_key") used to
 * pass the old `if (secret)` guard: the app called Paystack, got a 401, saw a
 * falsy `data.status`, and then fell through into a block that reported the
 * payment as successful anyway. Checking the key's *shape* rather than its
 * truthiness is what closes that path.
 */

export type PaystackMode = 'live' | 'sandbox' | 'unconfigured';

const PAYSTACK_API = 'https://api.paystack.co';

export function getPaystackSecret(): string {
  return process.env.PAYSTACK_SECRET_KEY || '';
}

/** A usable secret key: correct prefix, plausible length, not a placeholder. */
export function isPaystackLive(): boolean {
  const key = getPaystackSecret();
  return /^sk_(test|live)_/.test(key) && !/placeholder|changeme|your[-_]?key/i.test(key) && key.length > 20;
}

export function isSandboxMode(): boolean {
  return process.env.PAYSTACK_SANDBOX_MODE === 'true';
}

export function getPaystackMode(): PaystackMode {
  if (isPaystackLive()) return 'live';
  if (isSandboxMode()) return 'sandbox';
  return 'unconfigured';
}

export const UNCONFIGURED_MESSAGE =
  'Payments are not configured yet. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local, or set PAYSTACK_SANDBOX_MODE=true to simulate checkout.';

/** Naira -> kobo. Rounded because total_amount is NUMERIC and 35000.5 * 100 is not exact in IEEE754. */
export function toKobo(naira: number): number {
  return Math.round(Number(naira) * 100);
}

type PaystackResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

async function paystackFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<PaystackResult<T>> {
  if (!isPaystackLive()) {
    return { ok: false, error: UNCONFIGURED_MESSAGE };
  }

  try {
    const response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getPaystackSecret()}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.status) {
      return {
        ok: false,
        status: response.status,
        error: body?.message || `Paystack request failed (HTTP ${response.status})`,
      };
    }

    return { ok: true, data: body.data as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not reach Paystack' };
  }
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}): Promise<PaystackResult<PaystackInitData>> {
  return paystackFetch<PaystackInitData>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      // Was never sent, which made verifying the currency on the way back
      // meaningless - you cannot check a currency you did not request.
      currency: 'NGN',
      callback_url: params.callbackUrl,
      metadata: { app: 'AgroX Escrow', ...(params.metadata || {}) },
    }),
  });
}

export interface PaystackVerifyData {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  paid_at?: string;
  channel?: string;
}

export function verifyTransaction(reference: string): Promise<PaystackResult<PaystackVerifyData>> {
  return paystackFetch<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET' }
  );
}

export interface PaystackRefundData {
  id: number | string;
  status: string;
  transaction?: { reference?: string };
}

export function createPaystackRefund(params: {
  transactionReference: string;
  amountKobo?: number;
  merchantNote?: string;
  customerNote?: string;
}): Promise<PaystackResult<PaystackRefundData>> {
  return paystackFetch<PaystackRefundData>('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: params.transactionReference,
      // Omitting amount asks Paystack for a full refund.
      ...(params.amountKobo ? { amount: params.amountKobo } : {}),
      currency: 'NGN',
      ...(params.merchantNote ? { merchant_note: params.merchantNote } : {}),
      ...(params.customerNote ? { customer_note: params.customerNote } : {}),
    }),
  });
}

/** Reference for one payment attempt. Distinct from the order's own stable reference. */
export function mintPaymentReference(orderReference: string): string {
  return `${orderReference}-P${Date.now().toString(36).toUpperCase()}`;
}
