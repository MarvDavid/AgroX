import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/db';
import crypto from 'crypto';

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

    if (!buyerName || !buyerEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or missing order parameters' }, { status: 400 });
    }

    // Generate collision-resistant AgroX reference format (e.g., AGX-782194-A3F1)
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `AGX-${Date.now().toString().slice(-6)}-${randomHex}`;

    const order = await createOrder({
      reference,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim().toLowerCase(),
      buyerPhone: (buyerPhone || '').trim(),
      shippingAddress: (shippingAddress || '').trim(),
      items,
      totalAmount: Number(totalAmount) || items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0),
      escrowStatus: 'paid_escrow_secured',
      paystackReference: paystackReference || null,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

