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
              background: 'var(--accent-gold)',
            }}
          >
            SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="agrox-card-body">
        <span className="agrox-card-category">{product.category}</span>
        
        <h3
          className="agrox-card-title"
          onClick={() => onQuickView && onQuickView(product)}
          style={{ cursor: 'pointer' }}
        >
          {product.name}
        </h3>

        <div className="agrox-card-seller">
          <MapPin size={14} />
          <span>{product.seller.location}</span>
          {product.seller.verified && (
            <CheckCircle2 size={14} style={{ color: 'var(--primary-600)' }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
            <Star size={14} fill="currentColor" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.rating}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            ({product.reviewsCount})
          </span>
        </div>

        <div className="agrox-card-footer">
          <div>
            <div className="agrox-price">{formatCurrency(product.price)}</div>
            <div className="agrox-unit">per {product.unit}</div>
          </div>

          <button
            className="agrox-btn agrox-btn-primary"
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-full)' }}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            aria-label="Add to cart"
          >
            <ShoppingCart size={16} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
