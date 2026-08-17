'use client';

import React, { useState } from 'react';
import { X, Star, MapPin, ShieldCheck, ShoppingCart, MessageSquare } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onChatFarmer?: (product: Product) => void;
}

export default function ProductDetailModal({ product, onClose, onChatFarmer }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  return (
    <>
      <div
        className="agrox-drawer-backdrop"
        onClick={onClose}
        style={{ zIndex: 'var(--z-modal-backdrop)' }}
      />
      {/* .agrox-modal is a flex column: the header never scrolls, so the close
          button stays reachable on tall mobile content. */}
      <div className="agrox-modal agrox-modal--lg" role="dialog" aria-modal="true" aria-label={product.name}>
        <div className="agrox-modal-header">
          <h2 className="agrox-modal-title">{product.name}</h2>
          <button onClick={onClose} className="agrox-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div
          className="agrox-modal-body"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1.25rem',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '240px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <span className="agrox-card-category">{product.category}</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0.4rem 0 0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-accent)' }}>
                <Star size={15} fill="currentColor" />
                <span style={{ fontWeight: 700, marginLeft: '0.25rem', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                  {product.rating}
                </span>
              </div>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {product.reviewsCount} Customer Reviews
              </span>
            </div>

            <div style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--color-action-primary)', marginBottom: '0.75rem' }}>
              {formatCurrency(product.price)}{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                / {product.unit}
              </span>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.15rem' }}>
              {product.description}
            </p>

            {/* Seller card */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Farmer</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{product.seller.name}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    {product.seller.location}
                  </div>
                </div>
                {onChatFarmer && (
                  <button
                    onClick={() => {
                      onChatFarmer(product);
                      onClose();
                    }}
                    className="agrox-btn agrox-btn-outline"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    <MessageSquare size={14} /> Chat Farmer
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.65rem 0.85rem', background: 'var(--color-surface-muted)' }} aria-label="Decrease quantity">-</button>
                  <div style={{ padding: '0.65rem 0.75rem', fontWeight: 600, minWidth: '36px', textAlign: 'center', fontSize: '0.9rem' }}>{quantity}</div>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '0.65rem 0.85rem', background: 'var(--color-surface-muted)' }} aria-label="Increase quantity">+</button>
                </div>
                <button
                  className="agrox-btn agrox-btn-primary"
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
                  onClick={() => {
                    addToCart(product, quantity);
                    onClose();
                  }}
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', padding: '0.55rem', background: 'rgba(67, 160, 71, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600 }}>
                <ShieldCheck size={15} />
                AgroX Escrow Protected Payment
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
