'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toastMessage, toastVariant } = useCart();

  if (!toastMessage) return null;

  const isError = toastVariant === 'error';
  const accent = isError ? 'var(--color-error)' : 'var(--color-success)';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className="agrox-toast"
      role={isError ? 'alert' : 'status'}
      // .agrox-toast hardcodes a green left border; errors override just that.
      style={{ borderLeftColor: accent }}
    >
      <Icon size={18} style={{ color: accent, flexShrink: 0 }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>
        {toastMessage}
      </span>
    </div>
  );
}
