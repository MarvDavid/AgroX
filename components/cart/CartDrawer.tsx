'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 200;
  const progressPercent = Math.min((totalPrice / freeShippingThreshold) * 100, 100);

  return (
    <>
      <div
        className="agrox-drawer-backdrop"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="agrox-drawer">
        {/* Header */}
        <div
          className="agrox-drawer-section"
          style={{
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <ShoppingBag size={20} style={{ color: 'var(--color-action-primary)', flexShrink: 0 }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Your Cart ({totalItems})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            style={{ color: 'var(--color-text-secondary)', padding: '0.25rem', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div
          className="agrox-drawer-section"
          style={{
            paddingBlock: '0.85rem',
            background: 'var(--primitive-green-100)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              fontSize: '0.825rem',
              color: 'var(--color-action-primary)',
              fontWeight: 600,
              marginBottom: '0.35rem',
            }}
          >
            {totalPrice >= freeShippingThreshold
              ? '🎉 You qualify for FREE Nationwide Delivery!'
              : `Add ${formatCurrency(freeShippingThreshold - totalPrice)} more for FREE Delivery`}
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'var(--color-border)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--color-action-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="agrox-drawer-body">
          {cart.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Your cart is empty</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Explore fresh agricultural produce, seeds, and equipment!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 700, overflowWrap: 'anywhere' }}>
                      {product.name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {formatCurrency(product.price)} / {product.unit}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          style={{ padding: '0.2rem 0.5rem' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          style={{ padding: '0.2rem 0.5rem' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        style={{ color: 'var(--color-error)', padding: '0.2rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div
            className="agrox-drawer-section"
            style={{
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface-muted)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: 800,
              }}
            >
              <span>Total</span>
              <span style={{ color: 'var(--color-action-primary)' }}>
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="agrox-btn agrox-btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              onClick={() => setIsCartOpen(false)}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
