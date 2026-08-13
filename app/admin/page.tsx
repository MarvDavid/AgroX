'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  BarChart3, 
  Settings,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState('disputes');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'disputes', label: 'Dispute & Escrow Holds', icon: ShieldAlert },
    { id: 'users', label: 'Verified Farmers & Buyers', icon: Users },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
  ];

  const totalEscrowVolume = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.reference.toLowerCase().includes(q) ||
      ord.buyerName.toLowerCase().includes(q) ||
      ord.buyerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-muted)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 0' }} className="agrox-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="agrox-admin-grid">
          
          {/* Sidebar Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <ShieldAlert size={20} style={{ color: 'var(--color-error)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Admin Console</h2>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(38, 50, 56, 0.05)' : 'transparent',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Platform Administration</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Review and mediate escrow holds between buyers and farmers.</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search ref or buyer..." 
                    className="agrox-search-input" 
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={fetchOrders} className="agrox-btn agrox-btn-outline" style={{ padding: '0.6rem 0.85rem' }}>
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Platform Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Total System Orders</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-action-primary)' }}>{orders.length}</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Funds in Escrow Vault</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(totalEscrowVolume)}</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Escrow Security Score</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={24} /> 100%
                </div>
              </div>
            </div>

            {/* Orders & Disputes Table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.1rem' }}>
                All Platform Escrow Transactions ({filteredOrders.length})
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>Loading transactions...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No transactions found.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <tr>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Reference</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Buyer Details</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Produce Items</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Escrow Amount</th>
                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Escrow Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{ord.reference}</td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ord.buyerName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ord.buyerEmail}</div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                            {ord.items.map((i, idx) => (
                              <div key={idx}><strong>{i.productName}</strong> (Qty: {i.quantity})</div>
                            ))}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--color-action-primary)' }}>
                            {formatCurrency(ord.totalAmount)}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', background: 'rgba(67, 160, 71, 0.12)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                              <CheckCircle2 size={12} /> {ord.escrowStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{__html: `
        .agrox-admin-grid { grid-template-columns: 1fr; }
        @media(min-width: 992px) { .agrox-admin-grid { grid-template-columns: 250px 1fr; } }
      `}} />
    </div>
  );
}
