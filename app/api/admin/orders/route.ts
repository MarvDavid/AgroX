import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-error';
import { getOrders, updateOrderStatus } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { EscrowStatus } from '@/types';

const ALLOWED_STATUSES: EscrowStatus[] = [
  'pending',
  'paid_escrow_secured',
  'dispatched',
  'delivered',
  'escrow_released',
  'disputed',
  'refund_pending',
  'refunded',
];

/** The unfiltered order view, which used to be served publicly by /api/orders. */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const adminListingsOnly = searchParams.get('scope') === 'admin';

    const orders = await getOrders(undefined, undefined, { adminListingsOnly });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return errorResponse(error, 'Failed to load orders');
  }
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const reference = String(body?.reference || '').trim();
    const escrowStatus = body?.escrowStatus as EscrowStatus;

    if (!reference) {
      return NextResponse.json({ success: false, error: 'An order reference is required.' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(escrowStatus)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(reference, escrowStatus);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return errorResponse(error, 'Failed to update order');
  }
}
