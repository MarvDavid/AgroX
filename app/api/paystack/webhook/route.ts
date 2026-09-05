import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOrderByPaystackReference, transitionOrderStatus, updateOrderStatus } from '@/lib/db';
import { claimWebhookEvent, updateRefundByPaystackId } from '@/lib/db-admin';
import { getPaystackSecret, isPaystackLive, toKobo } from '@/lib/paystack';

/**
 * Paystack webhook receiver.
 *
 * Previously, when PAYSTACK_SECRET_KEY was unset the signature check was skipped
 * entirely - meaning anyone who found this URL could POST a charge.success and
 * mark any order paid. There is no unsigned path now: without a key the endpoint
 * refuses to process anything.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!isPaystackLive()) {
      return NextResponse.json(
        { success: false, error: 'Webhook is not configured; PAYSTACK_SECRET_KEY is missing.' },
        { status: 503 }
      );
    }

    const signature = request.headers.get('x-paystack-signature') || '';
    const expected = crypto
      .createHmac('sha512', getPaystackSecret())
      .update(rawBody)
      .digest('hex');

    // timingSafeEqual throws on a length mismatch, so compare fixed-size digests
    // of the two hex strings rather than the strings themselves.
    const signaturesMatch = crypto.timingSafeEqual(
      crypto.createHash('sha256').update(signature).digest(),
      crypto.createHash('sha256').update(expected).digest()
    );

    if (!signaturesMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid Paystack signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const data = event?.data || {};

    // Paystack retries deliveries; claim the id so a retry is a no-op.
    const eventId = String(data?.id || event?.id || '');
    const eventKey = eventId ? `${event?.event}:${eventId}` : '';
    if (eventKey && !(await claimWebhookEvent(eventKey))) {
      return NextResponse.json({ status: 'ok', duplicate: true });
    }

    switch (event?.event) {
      case 'charge.success': {
        const reference = data?.reference;
        if (!reference) break;

        const order = await getOrderByPaystackReference(reference);
        if (!order) break;

        // Re-check the amount here too: the webhook is a separate entry point
        // and must not trust the payload any more than verify does.
        if (Number(data?.amount) !== toKobo(order.totalAmount)) {
          console.warn(
            `[paystack webhook] amount mismatch for ${reference}: expected ${toKobo(order.totalAmount)}, got ${data?.amount}`
          );
          break;
        }

        await transitionOrderStatus(reference, 'pending', 'paid_escrow_secured');
        break;
      }

      // Refund events identify the transaction as `transaction_reference`, not
      // `reference` - reading `reference` here would silently look up undefined.
      case 'refund.processed': {
        const txReference = data?.transaction_reference;
        if (data?.id) await updateRefundByPaystackId(String(data.id), 'processed');
        if (txReference) await updateOrderStatus(txReference, 'refunded');
        break;
      }

      case 'refund.failed': {
        const txReference = data?.transaction_reference;
        if (data?.id) await updateRefundByPaystackId(String(data.id), 'failed');
        // Money did not move: put the order back to its funded state.
        if (txReference) await updateOrderStatus(txReference, 'paid_escrow_secured');
        break;
      }

      case 'refund.pending':
      case 'refund.processing': {
        if (data?.id) await updateRefundByPaystackId(String(data.id), 'processing');
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
