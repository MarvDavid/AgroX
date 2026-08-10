'use client';

import React from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, MapPin, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="agrox-card">
      <div 
        className="agrox-card-img-wrapper"
        onClick={() => onQuickView && onQuickView(product)}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="agrox-card-img"
        />
        {product.isOrganic && (
          <span className="agrox-card-badge">🌿 100% Organic</span>
        )}
        {product.originalPrice && (
          <span
            className="agrox-card-badge"
            style={{
              left: 'auto',
              right: '0.75rem',
              background: 'var(--color-accent)',
            }}
          >
            SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="agrox-card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          className="agrox-card-title"
          onClick={() => onQuickView && onQuickView(product)}
          style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}
        >
          {product.name}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <div className="agrox-price" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatCurrency(product.price)}</div>
          <div className="agrox-unit" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>per {product.unit}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
          <MapPin size={14} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.seller.location}</span>
          {product.seller.verified && (
            <CheckCircle2 size={14} style={{ color: 'var(--color-action-primary)', flexShrink: 0 }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--color-accent)' }}>
            <Star size={14} fill="currentColor" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.rating}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            ({product.reviewsCount})
          </span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            className="agrox-btn agrox-btn-primary"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
