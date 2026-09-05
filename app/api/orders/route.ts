import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-error';
import { getOrders, createOrder, getProductById } from '@/lib/db';
import { isAuthedRequest } from '@/lib/admin-auth';
import { OrderItem } from '@/types';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId') || undefined;
    const buyerEmail = searchParams.get('buyerEmail') || undefined;

    // Unscoped, this returned every order on the platform - buyer names, emails,
    // phone numbers, delivery addresses and totals - to anyone who asked.
    // The unfiltered view now lives behind /api/admin/orders.
    if (!farmerId && !buyerEmail && !isAuthedRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Specify a farmerId or buyerEmail to list orders.' },
        { status: 400 }
      );
    }

    const orders = await getOrders(farmerId, buyerEmail);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return errorResponse(error, 'Failed to fetch orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerName, buyerEmail, buyerPhone, shippingAddress, items } = body;

    if (!buyerName || !buyerEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or missing order parameters' }, { status: 400 });
    }

    // Prices come from the database, never from the request. The client sends
    // only what it wants and how much of it; sending `price` and `totalAmount`
    // meant a buyer could name their own price for any order.
    const resolvedItems: OrderItem[] = [];

    for (const line of items) {
      const productId = String(line?.productId || '');
      const quantity = Math.floor(Number(line?.quantity));

      if (!productId || !Number.isFinite(quantity) || quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'Each item needs a productId and a quantity of at least 1.' },
          { status: 400 }
        );
      }

      const product = await getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `"${productId}" is no longer available.`, code: 'PRODUCT_NOT_FOUND' },
          { status: 400 }
        );
      }
      if (!product.inStock) {
        return NextResponse.json(
          { success: false, error: `"${product.name}" is out of stock.`, code: 'OUT_OF_STOCK' },
          { status: 400 }
        );
      }

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        unit: product.unit,
        quantity,
        farmerId: product.seller.id,
        farmerName: product.seller.name,
        // Snapshotted so the admin order view survives a seller override.
        listedByAdmin: Boolean(product.listedByAdmin),
      });
    }

    const totalAmount = resolvedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Collision-resistant AgroX reference (e.g. AGX-782194-A3F1). This is the
    // internal, stable reference shown in the UI - the Paystack reference is
    // minted separately per payment attempt so a retry after an abandoned
    // payment isn't rejected as a duplicate.
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reference = `AGX-${Date.now().toString().slice(-6)}-${randomHex}`;

    const order = await createOrder({
      reference,
      buyerName: String(buyerName).trim(),
      buyerEmail: String(buyerEmail).trim().toLowerCase(),
      buyerPhone: String(buyerPhone || '').trim(),
      shippingAddress: String(shippingAddress || '').trim(),
      items: resolvedItems,
      totalAmount,
      // Orders are born unpaid. Nothing but a verified Paystack transaction
      // moves this to paid_escrow_secured.
      escrowStatus: 'pending',
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error, 'Failed to create order');
  }
}
