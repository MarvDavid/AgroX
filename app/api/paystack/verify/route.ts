import { NextRequest, NextResponse } from 'next/server';
import { getOrderByPaystackReference, transitionOrderStatus } from '@/lib/db';
import {
  UNCONFIGURED_MESSAGE,
  getPaystackMode,
  toKobo,
  verifyTransaction,
} from '@/lib/paystack';

/**
 * Confirms a payment with Paystack before an order is treated as funded.
 *
 * The previous version returned `{success: true, status: 'success'}` in two
 * situations where nothing had been paid: when no secret key was set, and when
 * Paystack itself reported failure (the success branch fell through into the
 * "sandbox" block). Both paths are gone - a payment that is not confirmed by
 * Paystack, for the right amount and currency, is reported as a failure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reference = String(body?.reference || '').trim();

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    const order = await getOrderByPaystackReference(reference);
    if (!order) {
      return NextResponse.json(
        { success: false, code: 'ORDER_NOT_FOUND', error: 'No order matches that payment reference.' },
        { status: 404 }
      );
    }

    const mode = getPaystackMode();

    if (mode === 'unconfigured') {
      return NextResponse.json(
        { success: false, code: 'PAYMENTS_UNCONFIGURED', error: UNCONFIGURED_MESSAGE },
        { status: 503 }
      );
    }

    if (mode === 'sandbox') {
      const { order: updated, alreadyApplied } = await transitionOrderStatus(
        reference,
        'pending',
        'paid_escrow_secured'
      );
      return NextResponse.json({
        success: true,
        mode: 'sandbox',
        simulated: true,
        escrowStatus: 'paid_escrow_secured',
        alreadyApplied,
        order: updated || order,
      });
    }

    const result = await verifyTransaction(reference);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, code: 'VERIFICATION_FAILED', error: result.error },
        { status: 502 }
      );
    }

    const tx = result.data;

    if (tx.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          code: 'PAYMENT_NOT_SUCCESSFUL',
          error: `Paystack reports this payment as "${tx.status}".`,
          paystackStatus: tx.status,
        },
        { status: 402 }
      );
    }

    // Amount and currency are checked against the stored order, so a transaction
    // for the right reference but the wrong value cannot fund it.
    const expectedKobo = toKobo(order.totalAmount);
    if (Number(tx.amount) !== expectedKobo) {
      return NextResponse.json(
        {
          success: false,
          code: 'AMOUNT_MISMATCH',
          error: `Paid amount does not match the order total. Expected ${expectedKobo} kobo, received ${tx.amount}.`,
        },
        { status: 409 }
      );
    }

    if (tx.currency && tx.currency !== 'NGN') {
      return NextResponse.json(
        { success: false, code: 'CURRENCY_MISMATCH', error: `Unexpected currency ${tx.currency}.` },
        { status: 409 }
      );
    }

    // Conditional transition: the webhook races this call constantly, and
    // whichever loses simply matches zero rows rather than applying twice.
    const { order: updated, alreadyApplied } = await transitionOrderStatus(
      reference,
      'pending',
      'paid_escrow_secured'
    );

    return NextResponse.json({
      success: true,
      mode: 'live',
      escrowStatus: 'paid_escrow_secured',
      alreadyApplied,
      order: updated || (await getOrderByPaystackReference(reference)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify Paystack payment' },
      { status: 500 }
    );
  }
}
