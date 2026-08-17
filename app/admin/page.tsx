'use client';

import React, { useState, useEffect } from 'react';
import PageShell from '@/components/layout/PageShell';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BarChart3,
  Search,
  CheckCircle2,
  RefreshCw,
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
    <PageShell muted wide>
        {/* No inline grid-template here: it would outrank the media query in
            .agrox-dash-grid and the sidebar column would never activate. */}
        <div className="agrox-dash-grid">

          {/* Mobile Horizontal Tab Navigation */}
          <div className="agrox-tab-strip visible-mobile">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`agrox-tab-chip ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Sidebar Nav */}
          <aside className="agrox-dash-sidebar hidden-mobile">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
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
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(38, 50, 56, 0.08)' : 'transparent',
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
          </aside>

          {/* Main Content Area */}
          <div className="agrox-dash-main">

            <div className="agrox-page-header" style={{ marginBottom: 0 }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 800, lineHeight: 1.25 }}>Platform Administration</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Review and mediate escrow holds between buyers and farmers.</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '380px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    type="text"
                    aria-label="Search transactions"
                    placeholder="Search ref or buyer..."
                    className="agrox-input"
                    style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={fetchOrders} className="agrox-btn agrox-btn-outline agrox-btn-icon" aria-label="Refresh orders">
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="agrox-stat-grid" style={{ marginBottom: 0 }}>
              <div className="agrox-stat-card">
                <div className="agrox-stat-label">Total System Orders</div>
                <div className="agrox-stat-value" style={{ color: 'var(--color-action-primary)' }}>{orders.length}</div>
              </div>
              <div className="agrox-stat-card">
                <div className="agrox-stat-label">Funds in Escrow Vault</div>
                <div className="agrox-stat-value">{formatCurrency(totalEscrowVolume)}</div>
              </div>
              <div className="agrox-stat-card">
                <div className="agrox-stat-label">Escrow Security Score</div>
                <div className="agrox-stat-value" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={22} style={{ flexShrink: 0 }} /> 100%
                </div>
              </div>
            </div>

            {/* Orders & Disputes Table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.05rem' }}>
                All Platform Escrow Transactions ({filteredOrders.length})
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>Loading transactions...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No transactions found.</div>
              ) : (
                <>
                  {/* Mobile Transaction Cards */}
                  <div className="visible-mobile" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredOrders.map((ord) => (
                      <div key={ord.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', background: 'var(--color-surface-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: 0, overflowWrap: 'anywhere' }}>{ord.reference}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(67, 160, 71, 0.12)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={12} /> {ord.escrowStatus.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{ord.buyerName}</div>
                        <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>{ord.buyerEmail}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {ord.items.map((i, idx) => (
                            <span key={idx} style={{ display: 'inline-block', marginRight: '0.5rem' }}>• {i.productName} (x{i.quantity})</span>
                          ))}
                        </div>
                        <div style={{ marginTop: '0.35rem', fontWeight: 800, color: 'var(--color-action-primary)', fontSize: '0.925rem' }}>
                          {formatCurrency(ord.totalAmount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  {/* .agrox-table-wrap owns overflow-x. It must not also be the
                      element carrying .hidden-mobile: that utility used to force
                      display:inline, and overflow has no effect on inline boxes,
                      so the table was clipped by the card instead of scrolling. */}
                  <div className="hidden-mobile">
                    <div className="agrox-table-wrap">
                      <table className="agrox-table">
                        <thead style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                          <tr>
                            <th style={{ fontWeight: 600 }}>Reference</th>
                            <th style={{ fontWeight: 600 }}>Buyer Details</th>
                            <th style={{ fontWeight: 600 }}>Produce Items</th>
                            <th style={{ fontWeight: 600 }}>Escrow Amount</th>
                            <th style={{ fontWeight: 600 }}>Escrow Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((ord) => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ fontWeight: 700 }}>{ord.reference}</td>
                              <td>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ord.buyerName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ord.buyerEmail}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>
                                {ord.items.map((i, idx) => (
                                  <div key={idx}><strong>{i.productName}</strong> (Qty: {i.quantity})</div>
                                ))}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--color-action-primary)' }}>
                                {formatCurrency(ord.totalAmount)}
                              </td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', background: 'rgba(67, 160, 71, 0.12)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                                  <CheckCircle2 size={12} /> {ord.escrowStatus.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
    </PageShell>
  );
}
