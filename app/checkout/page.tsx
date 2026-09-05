'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';
import Link from 'next/link';
import { setBuyerIdentity } from '@/lib/identity';

type Phase = 'form' | 'working' | 'complete' | 'failed';

const PAYSTACK_V2_SRC = 'https://js.paystack.co/v2/inline.js';

/** Loads Paystack Inline v2 once, resolving only when it has actually parsed. */
function loadPaystackScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in a browser'));
    if ((window as any).PaystackPop) return resolve((window as any).PaystackPop);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PAYSTACK_V2_SRC}"]`);
    const script = existing || document.createElement('script');

    const onLoad = () => {
      if ((window as any).PaystackPop) resolve((window as any).PaystackPop);
      else reject(new Error('Paystack script loaded but PaystackPop is unavailable'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('Could not load Paystack')), { once: true });

    if (!existing) {
      script.src = PAYSTACK_V2_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

function CheckoutView() {
  const { cart, totalPrice, clearCart } = useCart();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>('form');
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [simulated, setSimulated] = useState(false);

  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  const busy = phase === 'working';

  /**
   * Confirms a payment server-side. This is the ONLY thing that can mark an
   * order complete - previously the popup's onClose handler, and both catch
   * blocks, all booked a fully-paid order regardless of what happened.
   */
  const verifyPayment = useCallback(
    async (paymentReference: string) => {
      setStatusText('Confirming your payment...');

      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: paymentReference }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            'We could not confirm this payment. Your order is saved as unpaid - no money has been taken.'
        );
        setPhase('failed');
        return;
      }

      setSimulated(Boolean(data.simulated));
      clearCart();
      setPhase('complete');
    },
    [clearCart]
  );

  // Paystack's callback_url returns the buyer to /checkout?ref=... for channels
  // that redirect instead of resolving in the popup (bank transfer, USSD).
  const returnedRef = searchParams.get('ref');
  const handledReturnRef = useRef(false);

  useEffect(() => {
    if (!returnedRef || handledReturnRef.current) return;
    handledReturnRef.current = true;
    setPhase('working');
    setOrderRef(returnedRef.split('-P')[0]);
    verifyPayment(returnedRef).catch((e) => {
      setError(e?.message || 'Could not confirm the payment.');
      setPhase('failed');
    });
  }, [returnedRef, verifyPayment]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setPhase('working');
    setError('');

    // Remember who this is, so the buyer dashboard and any support conversation
    // resolve to the same person on the next visit.
    setBuyerIdentity({ name: shippingDetails.fullName, email: shippingDetails.email });

    try {
      // 1. Create the order first, unpaid. The server prices it from the
      //    database, so the client never states an amount.
      setStatusText('Creating your order...');
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: shippingDetails.fullName,
          buyerEmail: shippingDetails.email,
          buyerPhone: shippingDetails.phone,
          shippingAddress: shippingDetails.address,
          items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        setError(orderData.error || 'We could not create your order.');
        setPhase('failed');
        return;
      }

      const order = orderData.order;
      setOrderRef(order.reference);

      // 2. Start a payment against that order.
      setStatusText('Starting secure payment...');
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: order.reference }),
      });
      const initData = await initRes.json();

      if (!initRes.ok || !initData.success) {
        setError(
          initData.error ||
            'Payment could not be started. Your order is saved as unpaid and nothing has been charged.'
        );
        setPhase('failed');
        return;
      }

      // 3a. Sandbox is its own branch, never a fallback: resumeTransaction needs
      //     a genuine access code and would error on a fabricated one.
      if (initData.mode === 'sandbox') {
        await verifyPayment(initData.reference);
        return;
      }

      // 3b. Live: open the popup on the transaction the server initialized.
      setStatusText('Opening Paystack...');
      const PaystackPop = await loadPaystackScript();
      const popup = new PaystackPop();

      popup.resumeTransaction(initData.access_code, {
        onSuccess: (transaction: any) => {
          verifyPayment(transaction?.reference || initData.reference).catch((err) => {
            setError(err?.message || 'Could not confirm the payment.');
            setPhase('failed');
          });
        },
        onCancel: () => {
          // Dismissing the popup books nothing. This used to call finalizeOrder,
          // so abandoning checkout produced a paid order.
          setError(
            `Payment cancelled. Your order ${order.reference} has been saved as unpaid - you can pay for it later.`
          );
          setPhase('failed');
        },
        onError: (err: any) => {
          setError(err?.message || 'Paystack reported an error with this payment.');
          setPhase('failed');
        },
      });
    } catch (err: any) {
      // A thrown error is a failure, not a completed order.
      setError(err?.message || 'Something went wrong while starting your payment.');
      setPhase('failed');
    }
  };

  if (phase === 'complete') {
    return (
      <div
        className="agrox-panel"
        style={{
          textAlign: 'center',
          maxWidth: '580px',
          width: '100%',
          margin: '0 auto',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
        <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)', fontWeight: 800, lineHeight: 1.25 }}>
          {simulated ? 'Simulated Payment Complete' : 'Payment Verified & Escrow Secured'}
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            margin: '0.85rem 0 1.25rem',
            lineHeight: 1.5,
            fontSize: '0.9rem',
          }}
        >
          {simulated
            ? 'This ran in sandbox mode, so no real money moved. Add your Paystack keys to take live payments.'
            : 'Paystack has confirmed your transaction. Funds are held in the AgroX Escrow Vault until delivery is confirmed.'}
        </p>

        {simulated && (
          <div
            className="agrox-badge agrox-badge--warn"
            style={{ marginBottom: '1rem' }}
          >
            <FlaskConical size={13} /> Sandbox mode - no real payment
          </div>
        )}

        <div
          style={{
            background: 'var(--primitive-green-100)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--primitive-green-900)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <span style={{ overflowWrap: 'anywhere' }}>Order Reference: {orderRef}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Status: PAID &amp; ESCROW SECURED
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/buyer" className="agrox-btn agrox-btn-primary" style={{ flex: '1 1 180px', justifyContent: 'center' }}>
            View My Orders
          </Link>
          <Link href="/" className="agrox-btn agrox-btn-outline" style={{ flex: '1 1 180px', justifyContent: 'center' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          marginTop: '0.5rem',
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.25 }}>
        AgroX Paystack Escrow Checkout
      </h1>

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            background: 'rgba(211, 47, 47, 0.1)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.5,
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{error}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your cart is empty.</p>
          <Link href="/" className="agrox-btn agrox-btn-primary" style={{ marginTop: '1rem' }}>
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="agrox-checkout-grid">
          <form
            onSubmit={handlePlaceOrder}
            className="agrox-panel"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
              Shipping &amp; Delivery Address
            </h3>

            <div>
              <label className="agrox-label">Full Name / Enterprise Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe Enterprises"
                className="agrox-input"
                value={shippingDetails.fullName}
                onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
              <div style={{ minWidth: 0 }}>
                <label className="agrox-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@agricbuyer.com"
                  className="agrox-input"
                  value={shippingDetails.email}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label className="agrox-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 803 000 0000"
                  className="agrox-input"
                  value={shippingDetails.phone}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="agrox-label">Delivery Street Address / Grain Depot</label>
              <input
                type="text"
                required
                placeholder="Plot 4, Grain Depot Warehouse, Ikeja, Lagos"
                className="agrox-input"
                value={shippingDetails.address}
                onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
              />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem', marginTop: '0.5rem' }}>
              Select Payment Gateway
            </h3>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-action-primary)',
                background: 'var(--color-surface-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <CreditCard size={28} style={{ color: 'var(--color-action-primary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '0.925rem' }}>
                  Paystack Online Checkout (Escrow Protected)
                </div>
                <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Supports Cards, Bank Transfer, USSD, and Mobile Money. Funds held safely in escrow.
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="agrox-btn agrox-btn-primary"
              style={{ padding: '0.85rem 1rem', fontSize: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}
            >
              {busy ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  <span>{statusText || 'Working...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Pay {formatCurrency(totalPrice)} with Paystack Escrow</span>
                </>
              )}
            </button>
          </form>

          {/* Order Summary. Stickiness is applied by
              .agrox-checkout-summary-wrap at >=1024px only, where the grid
              is actually two columns. */}
          <div className="agrox-checkout-summary-wrap">
            <div className="agrox-panel">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                Order Summary ({cart.length} items)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                      <span style={{ fontWeight: 600 }}>{product.name}</span>
                      <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.785rem' }}>
                        Seller: {product.seller.name} • Qty: {quantity} ({formatCurrency(product.price)} / {product.unit})
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>
                      {formatCurrency(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  <span>Freight &amp; Logistics Inspection</span>
                  <span style={{ color: 'var(--color-action-primary)', fontWeight: 600 }}>INCLUDED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, marginTop: '0.35rem' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--color-action-primary)' }}>{formatCurrency(totalPrice)}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', lineHeight: 1.45 }}>
                  Prices are re-checked against the catalogue when your order is created.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="agrox-panel">Loading checkout...</div>}>
        <CheckoutView />
      </Suspense>
    </PageShell>
  );
}
