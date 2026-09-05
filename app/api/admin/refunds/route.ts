import { NextRequest, NextResponse } from 'next/server';
import { getOrderByReference, updateOrderStatus } from '@/lib/db';
import { createRefund, getRefunds, getRefundsForOrder, updateRefund } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { createPaystackRefund, getPaystackMode, toKobo } from '@/lib/paystack';
import { RefundStatus } from '@/types';

/**
 * Orders that have actually been funded. Nothing else can be refunded.
 *
 * 'refund_pending' is included so a partial refund does not lock out the
 * remainder - the running balance check below is what caps the total, not the
 * status. A fully 'refunded' order is excluded outright.
 */
const REFUNDABLE = new Set([
  'paid_escrow_secured',
  'dispatched',
  'delivered',
  'escrow_released',
  'refund_pending',
]);

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const refunds = await getRefunds();
    return NextResponse.json({ success: true, refunds });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load refunds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const orderReference = String(body?.orderReference || '').trim();
    const reason = String(body?.reason || '').trim();

    if (!orderReference) {
      return NextResponse.json({ success: false, error: 'An order reference is required.' }, { status: 400 });
    }

    const order = await getOrderByReference(orderReference);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (!REFUNDABLE.has(order.escrowStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${orderReference} is "${order.escrowStatus}" - only a funded order can be refunded.`,
        },
        { status: 409 }
      );
    }

    // Partial refunds are allowed, but the total refunded can never exceed what
    // was paid.
    // Counts committed intent, not just settled money: a manual_pending refund
    // is one an admin is about to issue by hand, and double-counting it as
    // available would let the same amount be refunded twice.
    const COMMITTED = new Set(['processed', 'processing', 'requested', 'manual_pending']);
    const alreadyRefunded = (await getRefundsForOrder(orderReference))
      .filter((r) => COMMITTED.has(r.status))
      .reduce((sum, r) => sum + r.amount, 0);

    const requested = body?.amount !== undefined ? Number(body.amount) : order.totalAmount - alreadyRefunded;

    if (!Number.isFinite(requested) || requested <= 0) {
      return NextResponse.json(
        { success: false, error: 'Refund amount must be greater than zero.' },
        { status: 400 }
      );
    }
    if (requested + alreadyRefunded > order.totalAmount + 0.001) {
      return NextResponse.json(
        {
          success: false,
          error: `That would refund more than was paid. Order total ${order.totalAmount}, already refunded ${alreadyRefunded}.`,
        },
        { status: 400 }
      );
    }

    const mode = getPaystackMode();
    const isFullRefund = Math.abs(requested + alreadyRefunded - order.totalAmount) < 0.001;

    // No live key: record the intent honestly rather than claiming money moved.
    if (mode !== 'live' || !order.paystackReference) {
      const refund = await createRefund({
        orderId: order.id,
        orderReference: order.reference,
        paystackReference: order.paystackReference,
        amount: requested,
        reason,
        status: 'manual_pending' as RefundStatus,
        adminNote: !order.paystackReference
          ? 'No Paystack transaction is attached to this order, so it must be refunded by hand.'
          : 'Recorded while Paystack was not configured. Refund it in the Paystack dashboard, then mark it processed.',
      });

      await updateOrderStatus(order.reference, 'refund_pending');

      return NextResponse.json(
        {
          success: true,
          refund,
          simulated: true,
          message:
            'Refund recorded, but NOT sent to Paystack - no live secret key is configured. Issue it manually in the Paystack dashboard.',
        },
        { status: 201 }
      );
    }

    const refund = await createRefund({
      orderId: order.id,
      orderReference: order.reference,
      paystackReference: order.paystackReference,
      amount: requested,
      reason,
      status: 'requested',
    });

    const result = await createPaystackRefund({
      transactionReference: order.paystackReference,
      // Omitting the amount asks Paystack for a full refund.
      amountKobo: isFullRefund ? undefined : toKobo(requested),
      merchantNote: reason || 'AgroX admin refund',
      customerNote: reason || 'Refund issued by AgroX',
    });

    if (!result.ok) {
      await updateRefund(refund.id, { status: 'failed', adminNote: result.error });
      return NextResponse.json({ success: false, error: result.error, refund }, { status: 502 });
    }

    const updated = await updateRefund(refund.id, {
      status: 'processing',
      paystackRefundId: String(result.data.id),
    });

    // The refund.processed webhook is what finally moves this to 'refunded'.
    await updateOrderStatus(order.reference, 'refund_pending');

    return NextResponse.json({ success: true, refund: updated || refund }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to issue refund' },
      { status: 500 }
    );
  }
}

/** Manual reconciliation, for refunds issued outside the app. */
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const status = body?.status as RefundStatus;

    const allowed: RefundStatus[] = ['requested', 'processing', 'processed', 'failed', 'manual_pending'];
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ success: false, error: 'A refund id and valid status are required.' }, { status: 400 });
    }

    const refund = await updateRefund(id, {
      status,
      ...(body?.adminNote !== undefined ? { adminNote: String(body.adminNote) } : {}),
    });

    if (!refund) {
      return NextResponse.json({ success: false, error: 'Refund not found.' }, { status: 404 });
    }

    if (status === 'processed') {
      await updateOrderStatus(refund.orderReference, 'refunded');
    }

    return NextResponse.json({ success: true, refund });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update refund' },
      { status: 500 }
    );
  }
}
