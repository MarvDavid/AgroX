'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Truck, CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const [orderComplete, setOrderComplete] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Nigeria',
    paymentMethod: 'escrow',
  });

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    setOrderComplete(true);
  };

  if (orderComplete) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 2rem',
              maxWidth: '550px',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              margin: '2rem',
            }}
          >
            <CheckCircle2 size={64} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Order Confirmed & Escrow Secured!</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0 1.5rem', lineHeight: 1.6 }}>
              Your order payment is securely held in AgroX Escrow until freight inspection & delivery confirmation.
            </p>
            <div
              style={{
                background: 'var(--primitive-green-100)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--primitive-green-900)',
                marginBottom: '2rem',
              }}
            >
              Order Reference: AGX-{Math.floor(100000 + Math.random() * 900000)}
            </div>
            <Link href="/" className="agrox-btn agrox-btn-primary">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }} className="agrox-container">
        <div style={{ margin: '2rem 0' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Catalog
          </Link>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
            AgroX Escrow Checkout
          </h1>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your cart is empty.</p>
              <Link href="/" className="agrox-btn agrox-btn-primary" style={{ marginTop: '1rem' }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="agrox-checkout-grid">
              {/* Form */}
              <form
                onSubmit={handlePlaceOrder}
                style={{
                  background: 'var(--color-surface)',
                  padding: '2rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  Shipping & Delivery Address
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Full Name / Enterprise Name
                  </label>
                  <input
                    type="text"
                    required
                    className="agrox-search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={shippingDetails.fullName}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={shippingDetails.email}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={shippingDetails.phone}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Delivery Street Address / Grain Depot
                  </label>
                  <input
                    type="text"
                    required
                    className="agrox-search-input"
                    style={{ paddingLeft: '1rem' }}
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                  />
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '1rem' }}>
                  Select Escrow Payment Option
                </h3>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-action-primary)',
                    background: 'var(--color-surface-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <ShieldCheck size={28} style={{ color: 'var(--color-action-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      AgroX Buyer Protection Escrow
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      Funds released to farmer only after produce arrival & quality check.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="agrox-btn agrox-btn-primary"
                  style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
                >
                  Confirm & Pay {formatCurrency(totalPrice)}
                </button>
              </form>

              {/* Order Summary */}
              <div>
                <div
                  style={{
                    background: 'var(--color-surface)',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    position: 'sticky',
                    top: '6rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Order Summary ({cart.length} items)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                    {cart.map(({ product, quantity }) => (
                      <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{product.name}</span>
                          <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.8rem' }}>
                            Qty: {quantity} ({formatCurrency(product.price)} / {product.unit})
                          </span>
                        </div>
                        <span style={{ fontWeight: 700 }}>
                          {formatCurrency(product.price * quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                      <span>Freight & Logistics</span>
                      <span style={{ color: 'var(--color-action-primary)', fontWeight: 600 }}>FREE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem' }}>
                      <span>Total Amount</span>
                      <span style={{ color: 'var(--color-action-primary)' }}>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
