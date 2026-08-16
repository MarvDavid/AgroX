'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
import { Order } from '@/types';

export default function BuyerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<{ id: string; name: string; sellerId: string; sellerName: string } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?buyerEmail=john@agricbuyer.com');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_escrow_secured':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(46, 125, 50, 0.12)', color: 'var(--color-success)', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            <ShieldCheck size={14} /> Escrow Secured
          </span>
        );
      case 'dispatched':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(2, 136, 209, 0.12)', color: '#0288D1', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            <Truck size={14} /> Freight Dispatched
          </span>
        );
      case 'delivered':
      case 'escrow_released':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(76, 175, 80, 0.2)', color: '#2E7D32', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 size={14} /> Completed & Released
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 179, 0, 0.15)', color: '#F57F17', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            <Clock size={14} /> Pending Payment
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-muted)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1.5rem 0' }} className="agrox-container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
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
            style={{ width: 'auto' }}
          >
            <MessageSquare size={18} /> Open Direct Messages
          </button>
        </div>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Active Escrow Orders</div>
            <div style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--color-action-primary)' }}>{orders.length}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total Procurement Spent</div>
            <div style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.85rem)', fontWeight: 800, wordBreak: 'break-word' }}>
              {formatCurrency(orders.reduce((acc, curr) => acc + curr.totalAmount, 0))}
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Protected Escrow Vault</div>
            <div style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.85rem)', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} /> 100% Secured
            </div>
          </div>
        </div>

        {/* Order History Table / List */}
        <div className="agrox-buyer-card" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
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
                        <div style={{ flex: '1 1 200px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                            Seller: <strong>{item.farmerName}</strong> • Qty: {item.quantity} ({item.unit})
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', width: 'auto' }}>
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
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-action-primary)' }}>
                      Total: {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetProduct={chatProduct}
        currentUser={{ id: 'buyer-001', name: 'John Doe Enterprise', role: 'buyer' }}
      />
    </div>
  );
}
