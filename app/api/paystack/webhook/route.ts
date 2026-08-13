import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatus } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Verify Paystack Webhook HMAC-SHA512 Signature if secret is configured
    if (paystackSecret) {
      const signature = request.headers.get('x-paystack-signature');
      const hash = crypto
        .createHmac('sha512', paystackSecret)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ success: false, error: 'Invalid Paystack signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data?.reference;

      if (reference) {
        await updateOrderStatus(reference, 'paid_escrow_secured');
      }
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
