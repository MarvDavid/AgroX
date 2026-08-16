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

      <main style={{ flex: 1, padding: '1.5rem 0' }} className="agrox-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="agrox-admin-grid">
          
          {/* Mobile Horizontal Tab Navigation */}
          <div className="agrox-tab-strip visible-mobile" style={{ marginBottom: '0.5rem' }}>
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
          <aside className="hidden-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 800, lineHeight: 1.25 }}>Platform Administration</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Review and mediate escrow holds between buyers and farmers.</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '380px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search ref or buyer..." 
                    className="agrox-search-input" 
                    style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={fetchOrders} className="agrox-btn agrox-btn-outline" style={{ padding: '0.55rem 0.75rem' }} aria-label="Refresh orders">
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Platform Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total System Orders</div>
                <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--color-action-primary)' }}>{orders.length}</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Funds in Escrow Vault</div>
                <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800, wordBreak: 'break-word' }}>{formatCurrency(totalEscrowVolume)}</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Escrow Security Score</div>
                <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={22} /> 100%
                </div>
              </div>
            </div>

            {/* Orders & Disputes Table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', fontWeight: 800, fontSize: '1.05rem' }}>
                All Platform Escrow Transactions ({filteredOrders.length})
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>Loading transactions...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No transactions found.</div>
              ) : (
                <>
                  {/* Mobile Transaction Cards */}
                  <div className="visible-mobile" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredOrders.map((ord) => (
                      <div key={ord.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', background: 'var(--color-surface-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{ord.reference}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(67, 160, 71, 0.12)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700 }}>
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
                  <div className="hidden-mobile" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        <tr>
                          <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Reference</th>
                          <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Buyer Details</th>
                          <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Produce Items</th>
                          <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Escrow Amount</th>
                          <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Escrow Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{ord.reference}</td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ord.buyerName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ord.buyerEmail}</div>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                              {ord.items.map((i, idx) => (
                                <div key={idx}><strong>{i.productName}</strong> (Qty: {i.quantity})</div>
                              ))}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--color-action-primary)' }}>
                              {formatCurrency(ord.totalAmount)}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', background: 'rgba(67, 160, 71, 0.12)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                                <CheckCircle2 size={12} /> {ord.escrowStatus.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
