'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="agrox-toast">
      <CheckCircle2 size={18} style={{ color: 'var(--primary-500)' }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMessage}</span>
    </div>
  );
}
