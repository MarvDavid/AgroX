import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-error';
import { getOrderByReference, setOrderPaystackReference } from '@/lib/db';
import {
  UNCONFIGURED_MESSAGE,
  getPaystackMode,
  initializeTransaction,
  mintPaymentReference,
  toKobo,
} from '@/lib/paystack';

/**
 * Starts a payment for an order that already exists.
 *
 * The amount comes from the stored order, never from the request body - the
 * previous version took `amount` from the client, so the price paid was whatever
 * the browser said it was.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderReference = String(body?.orderReference || '').trim();

    if (!orderReference) {
      return NextResponse.json(
        { success: false, error: 'An orderReference is required.' },
        { status: 400 }
      );
    }

    const order = await getOrderByReference(orderReference);
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          code: 'ORDER_NOT_FOUND',
          error:
            'That order could not be found. If the server restarted mid-checkout while running without a database, the order was lost - please place it again.',
        },
        { status: 404 }
      );
    }

    if (order.escrowStatus !== 'pending') {
      return NextResponse.json(
        { success: false, code: 'ALREADY_PAID', error: 'This order has already been paid for.' },
        { status: 409 }
      );
    }

    // A fresh reference per attempt: orders.reference is UNIQUE and Paystack
    // rejects a reference it has seen before, so reusing it would make
    // retry-after-abandon impossible.
    const paymentReference = mintPaymentReference(order.reference);
    const mode = getPaystackMode();

    if (mode === 'unconfigured') {
      return NextResponse.json(
        { success: false, code: 'PAYMENTS_UNCONFIGURED', error: UNCONFIGURED_MESSAGE },
        { status: 503 }
      );
    }

    await setOrderPaystackReference(order.reference, paymentReference);

    if (mode === 'sandbox') {
      // A distinct branch, not a fallback: the sandbox never touches PaystackPop,
      // because resumeTransaction() needs a real access code from a real
      // initialize call and would simply error on a fabricated one.
      return NextResponse.json({
        success: true,
        mode: 'sandbox',
        reference: paymentReference,
        amount: order.totalAmount,
      });
    }

    const result = await initializeTransaction({
      email: order.buyerEmail,
      amountKobo: toKobo(order.totalAmount),
      reference: paymentReference,
      callbackUrl: `${request.nextUrl.origin}/checkout?ref=${encodeURIComponent(paymentReference)}`,
      metadata: {
        order_reference: order.reference,
        buyer_name: order.buyerName,
        delivery_address: order.shippingAddress,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      mode: 'live',
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
      amount: order.totalAmount,
    });
  } catch (error: any) {
    return errorResponse(error, 'Failed to initialize Paystack checkout');
  }
}
