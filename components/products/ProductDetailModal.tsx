'use client';

import React, { useState } from 'react';
import { X, Star, MapPin, ShieldCheck, ShoppingCart, Truck, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  return (
    <>
      <div
        className="agrox-drawer-backdrop"
        onClick={onClose}
        style={{ zIndex: 110 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 111,
          overflowY: 'auto',
          padding: '2rem',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--color-surface-muted)',
            borderRadius: '9999px',
            padding: '0.5rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          <div>
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '320px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>

          <div>
            <span className="agrox-card-category">{product.category}</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem' }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-accent)' }}>
                <Star size={16} fill="currentColor" />
                <span style={{ fontWeight: 700, marginLeft: '0.25rem', color: 'var(--color-text-primary)' }}>
                  {product.rating}
                </span>
              </div>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {product.reviewsCount} Customer Reviews
              </span>
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-action-primary)', marginBottom: '1rem' }}>
              {formatCurrency(product.price)}{' '}
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                / {product.unit}
              </span>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            {/* Seller card */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                <span>{product.seller.name}</span>
                {product.seller.verified && (
                  <span
                    style={{
                      background: 'var(--primitive-green-100)',
                      color: 'var(--primitive-green-900)',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    VERIFIED SELLER
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {product.seller.location}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                className="agrox-btn agrox-btn-primary"
                style={{ flex: 1, padding: '0.85rem' }}
                onClick={() => {
                  addToCart(product, quantity);
                  onClose();
                }}
              >
                <ShoppingCart size={18} />
                <span>Add {quantity} to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
