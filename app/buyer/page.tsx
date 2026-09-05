'use client';

import React, { useState, useEffect } from 'react';
import PageShell from '@/components/layout/PageShell';
import ChatDrawer from '@/components/chat/ChatDrawer';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { EscrowStatus, Order } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { DEMO_BUYER, getBuyerIdentity } from '@/lib/identity';
import { ADMIN_SELLER_ID, ADMIN_SUPPORT_NAME } from '@/lib/constants';

export default function BuyerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<{ id: string; name: string; sellerId: string; sellerName: string } | null>(null);
  const [identity, setIdentity] = useState(DEMO_BUYER);

  useEffect(() => {
    const current = getBuyerIdentity();
    setIdentity(current);
    fetchOrders(current.email);
  }, []);

  const fetchOrders = async (buyerEmail: string) => {
    try {
      const res = await fetch(`/api/orders?buyerEmail=${encodeURIComponent(buyerEmail)}`);
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch buyer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (productId: string, productName: string, farmerId: string, farmerName: string) => {
    setChatProduct({
      id: productId,
      name: productName,
      sellerId: farmerId,
      sellerName: farmerName,
    });
    setIsChatOpen(true);
  };

  // Was four hand-rolled pills here, disagreeing with the admin and seller
  // versions on both shape and colour. StatusBadge is the single source now.
  const getStatusBadge = (status: string) => <StatusBadge status={status as EscrowStatus} size={14} />;

  // Only funded orders represent money actually held in escrow; summing every
  // order would count abandoned, unpaid carts as spend.
  const FUNDED: EscrowStatus[] = ['paid_escrow_secured', 'dispatched', 'delivered', 'escrow_released'];
  const fundedTotal = orders
    .filter((o) => FUNDED.includes(o.escrowStatus))
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const openSupport = (order: Order) => {
    // Reuses the existing chat thread machinery with the platform as the
    // counterparty, so no new component is needed.
    setChatProduct({
      id: `support-${order.reference}`,
      name: `Order ${order.reference}`,
      sellerId: ADMIN_SELLER_ID,
      sellerName: ADMIN_SUPPORT_NAME,
    });
    setIsChatOpen(true);
  };


  return (
    <PageShell muted wide>
        {/* Header */}
        <div className="agrox-page-header">
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2 }}>Buyer Command Center</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.35rem', fontSize: '0.9rem', maxWidth: '650px' }}>
              Track your agricultural procurement orders, escrow guarantees & farmer conversations.
            </p>
          </div>
          <button
            onClick={() => {
              setChatProduct(null);
              setIsChatOpen(true);
            }}
            className="agrox-btn agrox-btn-primary"
          >
            <MessageSquare size={18} /> Open Direct Messages
          </button>
        </div>

        {/* Overview Stats */}
        <div className="agrox-stat-grid">
          <div className="agrox-stat-card">
            <div className="agrox-stat-label">Active Escrow Orders</div>
            <div className="agrox-stat-value" style={{ color: 'var(--color-action-primary)' }}>{orders.length}</div>
          </div>
          <div className="agrox-stat-card">
            <div className="agrox-stat-label">Total Procurement Spent</div>
            <div className="agrox-stat-value">
              {formatCurrency(fundedTotal)}
            </div>
          </div>
          <div className="agrox-stat-card">
            <div className="agrox-stat-label">Protected Escrow Vault</div>
            <div className="agrox-stat-value" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} style={{ flexShrink: 0 }} /> 100% Secured
            </div>
          </div>
        </div>

        {/* Order History Table / List */}
        <div className="agrox-panel">
          <h2 className="agrox-panel-title">
            Purchased Produce & Active Escrow Guarantees
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>Loading buyer orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No orders placed yet</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>Explore verified produce from accredited farmers across Nigeria.</p>
              <Link href="/" className="agrox-btn agrox-btn-primary">Browse Produce Catalog</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    background: 'var(--color-surface-muted)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Ref: {order.reference}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.escrowStatus)}</div>
                  </div>

                  {/* Order Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', background: 'var(--color-surface)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ flex: '1 1 200px', minWidth: 0, overflowWrap: 'anywhere' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                            Seller: <strong>{item.farmerName}</strong> • Qty: {item.quantity} ({item.unit})
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleOpenChat(item.productId, item.productName, item.farmerId, item.farmerName)}
                            className="agrox-btn agrox-btn-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.785rem' }}
                          >
                            <MessageSquare size={14} /> Chat Seller
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      Delivery: {order.shippingAddress || 'Default Warehouse'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openSupport(order)}
                        className="agrox-btn agrox-btn-outline agrox-btn-sm"
                      >
                        <MessageSquare size={13} /> Contact Support
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-action-primary)' }}>
                        Total: {formatCurrency(order.totalAmount)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetProduct={chatProduct}
        currentUser={{ id: identity.id, name: identity.name, role: 'buyer' }}
      />
    </PageShell>
  );
}
