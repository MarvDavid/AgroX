'use client';

import React from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { EscrowStatus, RefundStatus } from '@/types';

/**
 * The single rendering of an escrow status.
 *
 * There were three hand-rolled versions of this - buyer/page.tsx, admin/page.tsx
 * and seller/page.tsx - that disagreed on shape (12px vs --radius-sm) and, more
 * importantly, on colour: admin and seller painted *every* status green with a
 * checkmark. That was merely redundant while every order was born
 * 'paid_escrow_secured'; now that orders start 'pending' and can end 'refunded',
 * it would actively misreport an unpaid order as funded.
 */

type Variant = 'success' | 'warn' | 'error' | 'info' | 'neutral';

const ESCROW_PRESENTATION: Record<
  EscrowStatus,
  { label: string; variant: Variant; Icon: LucideIcon }
> = {
  pending: { label: 'Pending Payment', variant: 'warn', Icon: Clock },
  paid_escrow_secured: { label: 'Escrow Secured', variant: 'success', Icon: ShieldCheck },
  dispatched: { label: 'Dispatched', variant: 'info', Icon: Truck },
  delivered: { label: 'Delivered', variant: 'success', Icon: CheckCircle2 },
  escrow_released: { label: 'Escrow Released', variant: 'success', Icon: CheckCircle2 },
  disputed: { label: 'Disputed', variant: 'error', Icon: AlertTriangle },
  refund_pending: { label: 'Refund Pending', variant: 'warn', Icon: RotateCcw },
  refunded: { label: 'Refunded', variant: 'neutral', Icon: Undo2 },
};

const REFUND_PRESENTATION: Record<
  RefundStatus,
  { label: string; variant: Variant; Icon: LucideIcon }
> = {
  requested: { label: 'Requested', variant: 'warn', Icon: Clock },
  processing: { label: 'Processing', variant: 'info', Icon: RotateCcw },
  processed: { label: 'Refunded', variant: 'success', Icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error', Icon: AlertTriangle },
  manual_pending: { label: 'Manual - Not Sent', variant: 'neutral', Icon: AlertTriangle },
};

export function StatusBadge({ status, size = 13 }: { status: EscrowStatus; size?: number }) {
  const preset = ESCROW_PRESENTATION[status] || {
    label: String(status).replace(/_/g, ' '),
    variant: 'neutral' as Variant,
    Icon: Clock as LucideIcon,
  };
  const { label, variant, Icon } = preset;

  return (
    <span className={`agrox-badge agrox-badge--${variant}`}>
      <Icon size={size} /> {label}
    </span>
  );
}

export function RefundStatusBadge({ status, size = 13 }: { status: RefundStatus; size?: number }) {
  const preset = REFUND_PRESENTATION[status] || {
    label: String(status).replace(/_/g, ' '),
    variant: 'neutral' as Variant,
    Icon: Clock as LucideIcon,
  };
  const { label, variant, Icon } = preset;

  return (
    <span className={`agrox-badge agrox-badge--${variant}`}>
      <Icon size={size} /> {label}
    </span>
  );
}

export default StatusBadge;
