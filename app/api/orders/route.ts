import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId') || undefined;
    const buyerEmail = searchParams.get('buyerEmail') || undefined;

    const orders = await getOrders(farmerId, buyerEmail);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerName, buyerEmail, buyerPhone, shippingAddress, items, totalAmount, paystackReference } = body;

    if (!buyerName || !buyerEmail || !items || !items.length) {
      return NextResponse.json({ success: false, error: 'Invalid order parameters' }, { status: 400 });
    }

    const reference = `AGX-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await createOrder({
      reference,
      buyerName,
      buyerEmail,
      buyerPhone: buyerPhone || '',
      shippingAddress: shippingAddress || '',
      items,
      totalAmount,
      escrowStatus: 'paid_escrow_secured',
      paystackReference,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
