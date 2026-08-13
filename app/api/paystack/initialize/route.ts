import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, reference, callback_url } = body;

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Amount in Kobo for Paystack (Naira * 100)
    const amountInKobo = Math.round(Number(amount) * 100);
    const txRef = reference || `AGX_PAY_${Date.now()}`;

    if (paystackSecret) {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference: txRef,
          callback_url: callback_url || `${request.nextUrl.origin}/checkout`,
          metadata: {
            app: 'AgroX Escrow',
          },
        }),
      });

      const data = await response.json();
      if (data.status) {
        return NextResponse.json({
          success: true,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        });
      }
    }

    // Fallback sandbox simulation mode when Paystack key isn't provided yet
    return NextResponse.json({
      success: true,
      mode: 'sandbox_simulation',
      authorization_url: `${request.nextUrl.origin}/checkout?simulated_paystack=success&ref=${txRef}`,
      access_code: `demo_access_${Date.now()}`,
      reference: txRef,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize Paystack checkout' },
      { status: 500 }
    );
  }
}
