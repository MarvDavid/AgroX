'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import ProductComposer from '@/components/admin/ProductComposer';
import StatusBadge, { RefundStatusBadge } from '@/components/ui/StatusBadge';
import {
  LayoutDashboard,
  Package,
  ShieldAlert,
  Undo2,
  MessageSquare,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Send,
  AlertCircle,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ChatMessage, ChatThread, EscrowStatus, Order, Product, Refund } from '@/types';
import { ADMIN_SELLER_ID } from '@/lib/constants';
import { useCart } from '@/context/CartContext';

type TabId = 'overview' | 'products' | 'orders' | 'refunds' | 'support';

const NEXT_STATUS: Partial<Record<EscrowStatus, { next: EscrowStatus; label: string }>> = {
  paid_escrow_secured: { next: 'dispatched', label: 'Mark Dispatched' },
  dispatched: { next: 'delivered', label: 'Mark Delivered' },
  delivered: { next: 'escrow_released', label: 'Release Escrow' },
};

export default function AdminPortalPage() {
  const router = useRouter();
  const { showToast } = useCart();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adminOrdersOnly, setAdminOrdersOnly] = useState(false);

  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  /** Any /api/admin/* 401 means the session lapsed - send them back to login. */
  const request = useCallback(
    async (url: string, init?: RequestInit) => {
      const res = await fetch(url, init);
      if (res.status === 401) {
        router.replace('/admin/login?next=/admin');
        throw new Error('Your admin session expired.');
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      return json;
    },
    [router]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes, refundsRes, chatsRes] = await Promise.all([
        request(`/api/admin/orders${adminOrdersOnly ? '?scope=admin' : ''}`),
        request('/api/admin/products'),
        request('/api/admin/refunds'),
        request('/api/admin/chats'),
      ]);
      setOrders(ordersRes.orders || []);
      setProducts(productsRes.products || []);
      setRefunds(refundsRes.refunds || []);
      setThreads(chatsRes.threads || []);
      if (productsRes.warning) setError(productsRes.warning);
    } catch (e: any) {
      setError(e?.message || 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }, [request, adminOrdersOnly]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
  };

  /* ---------- Products ---------- */

  const knownSellers = useMemo(() => {
    const seen = new Map<string, Product['seller']>();
    for (const p of products) {
      if (p.seller?.id && !seen.has(p.seller.id)) seen.set(p.seller.id, p.seller);
    }
    return Array.from(seen.values());
  }, [products]);

  const handleSaved = (product: Product, mode: 'created' | 'updated', warning?: string) => {
    setProducts((prev) =>
      mode === 'created' ? [product, ...prev] : prev.map((p) => (p.id === product.id ? product : p))
    );
    setComposerOpen(false);
    setEditing(null);

    // A degraded save still succeeded, but only into memory - say so rather than
    // reporting it like a normal publish.
    if (warning) {
      setError(warning);
      showToast(warning, 'error');
      return;
    }
    showToast(mode === 'created' ? `"${product.name}" is now live` : `"${product.name}" updated`);
  };

  // Two-step delete: the first click arms it, the second confirms. Avoids a
  // blocking window.confirm while still making deletion deliberate.
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const handleDelete = async (product: Product) => {
    if (deleteCandidate !== product.id) {
      setDeleteCandidate(product.id);
      setTimeout(() => setDeleteCandidate((cur) => (cur === product.id ? null : cur)), 4000);
      return;
    }
    try {
      await request(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`"${product.name}" deleted`);
    } catch (e: any) {
      showToast(e?.message || 'Could not delete that listing', 'error');
    } finally {
      setDeleteCandidate(null);
    }
  };

  /* ---------- Orders ---------- */

  const advanceOrder = async (order: Order, next: EscrowStatus) => {
    try {
      const json = await request('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: order.reference, escrowStatus: next }),
      });
      setOrders((prev) => prev.map((o) => (o.reference === order.reference ? json.order : o)));
      showToast(`${order.reference} → ${next.replace(/_/g, ' ')}`);
    } catch (e: any) {
      showToast(e?.message || 'Could not update that order', 'error');
    }
  };

  /* ---------- Refunds ---------- */

  const issueRefund = async (order: Order) => {
    const reason = 'Refund issued from the admin console';
    try {
      const json = await request('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: order.reference, reason }),
      });
      setRefunds((prev) => [json.refund, ...prev]);
      showToast(
        json.simulated
          ? 'Refund recorded, but NOT sent to Paystack - no live key configured'
          : `Refund submitted for ${order.reference}`,
        json.simulated ? 'error' : 'success'
      );
      loadAll();
    } catch (e: any) {
      showToast(e?.message || 'Could not issue that refund', 'error');
    }
  };

  const markRefundProcessed = async (refund: Refund) => {
    try {
      const json = await request('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: refund.id, status: 'processed' }),
      });
      setRefunds((prev) => prev.map((r) => (r.id === refund.id ? json.refund : r)));
      showToast('Refund marked as processed');
      loadAll();
    } catch (e: any) {
      showToast(e?.message || 'Could not update that refund', 'error');
    }
  };

  /* ---------- Support ---------- */

  const openThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setMessages([]);
    try {
      const json = await request(`/api/admin/chats?chatId=${encodeURIComponent(thread.id)}`);
      setMessages(json.messages || []);
    } catch (e: any) {
      showToast(e?.message || 'Could not load that conversation', 'error');
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    setSendingReply(true);
    const text = replyText;
    setReplyText('');
    try {
      const json = await request('/api/admin/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeThread.id, text }),
      });
      setMessages((prev) => [...prev, json.message]);
    } catch (e: any) {
      setReplyText(text); // Put it back rather than losing what they typed.
      showToast(e?.message || 'Could not send that reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  /* ---------- Derived ---------- */

  const navItems: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Product Listings', icon: Package },
    { id: 'orders', label: 'Orders & Escrow', icon: ShieldAlert },
    { id: 'refunds', label: 'Refunds', icon: Undo2 },
    { id: 'support', label: 'Support Inbox', icon: MessageSquare },
  ];

  // Only funded orders count as money held. Summing every order would include
  // abandoned, unpaid carts in "Funds in Escrow".
  const FUNDED: EscrowStatus[] = ['paid_escrow_secured', 'dispatched', 'delivered'];
  const escrowVolume = orders
    .filter((o) => FUNDED.includes(o.escrowStatus))
    .reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.escrowStatus === 'pending').length;
  const openRefunds = refunds.filter((r) => r.status !== 'processed' && r.status !== 'failed').length;

  const q = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter(
    (o) =>
      !q ||
      o.reference.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.buyerEmail.toLowerCase().includes(q)
  );
  const filteredProducts = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );

  const panelStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  };
  const panelHeaderStyle: React.CSSProperties = {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border)',
    fontWeight: 800,
    fontSize: '1.05rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  };
  const theadStyle: React.CSSProperties = {
    background: 'var(--color-surface-muted)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
  };
  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--color-text-secondary)',
  };
  const mobileCardStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem',
    background: 'var(--color-surface-muted)',
  };

  return (
    <PageShell muted wide>
      {/* No inline grid-template here: it would outrank the media query in
          .agrox-dash-grid and the sidebar column would never activate. */}
      <div className="agrox-dash-grid">
        {/* Mobile Horizontal Tab Navigation */}
        <div className="agrox-tab-strip visible-mobile">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`agrox-tab-chip ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar Nav */}
        <aside className="agrox-dash-sidebar hidden-mobile">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
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

          <button
            onClick={handleLogout}
            className="agrox-btn agrox-btn-outline agrox-btn-sm"
            style={{ marginTop: '0.75rem', justifyContent: 'center' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="agrox-dash-main">
          <div className="agrox-page-header" style={{ marginBottom: 0 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 800, lineHeight: 1.25 }}>
                Platform Administration
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Manage listings, escrow, refunds and buyer support.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '380px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <input
                  type="text"
                  aria-label="Search"
                  placeholder="Search ref, buyer or product..."
                  className="agrox-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={loadAll} className="agrox-btn agrox-btn-outline agrox-btn-icon" aria-label="Refresh">
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                background: 'rgba(211, 47, 47, 0.1)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{error}</span>
            </div>
          )}

          {/* ---------------- OVERVIEW ---------------- */}
          {activeTab === 'overview' && (
            <>
              <div className="agrox-stat-grid" style={{ marginBottom: 0 }}>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Funds in Escrow Vault</div>
                  <div className="agrox-stat-value">{formatCurrency(escrowVolume)}</div>
                </div>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Total Orders</div>
                  <div className="agrox-stat-value" style={{ color: 'var(--color-action-primary)' }}>
                    {orders.length}
                  </div>
                </div>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Awaiting Payment</div>
                  <div className="agrox-stat-value" style={{ color: 'var(--color-warning)' }}>
                    {pendingCount}
                  </div>
                </div>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Live Listings</div>
                  <div className="agrox-stat-value">{products.length}</div>
                </div>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Open Refunds</div>
                  <div className="agrox-stat-value" style={{ color: openRefunds ? 'var(--color-error)' : undefined }}>
                    {openRefunds}
                  </div>
                </div>
                <div className="agrox-stat-card">
                  <div className="agrox-stat-label">Support Threads</div>
                  <div className="agrox-stat-value">{threads.length}</div>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={panelHeaderStyle}>Recent Activity</div>
                {loading ? (
                  <div style={emptyStyle}>Loading...</div>
                ) : orders.length === 0 ? (
                  <div style={emptyStyle}>No orders yet.</div>
                ) : (
                  <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{o.reference}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{o.buyerName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-action-primary)', fontSize: '0.9rem' }}>
                            {formatCurrency(o.totalAmount)}
                          </span>
                          <StatusBadge status={o.escrowStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------------- PRODUCTS ---------------- */}
          {activeTab === 'products' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <span>Product Listings ({filteredProducts.length})</span>
                <button
                  className="agrox-btn agrox-btn-primary agrox-btn-sm"
                  onClick={() => {
                    setEditing(null);
                    setComposerOpen(true);
                  }}
                >
                  <Plus size={15} /> Add Product
                </button>
              </div>

              {loading ? (
                <div style={emptyStyle}>Loading listings...</div>
              ) : filteredProducts.length === 0 ? (
                <div style={emptyStyle}>
                  <Package size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    No listings yet
                  </h3>
                  <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>
                    Add your first product to put it in front of buyers.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="visible-mobile" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredProducts.map((p) => (
                      <div key={p.id} style={mobileCardStyle}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          {p.image && (
                            <img
                              src={p.image}
                              alt=""
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                            />
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{p.name}</div>
                            <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)' }}>{p.category}</div>
                            <div style={{ fontWeight: 800, color: 'var(--color-action-primary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                              {formatCurrency(p.price)} / {p.unit}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                          <span className={`agrox-badge ${p.inStock ? 'agrox-badge--success' : 'agrox-badge--error'}`}>
                            {p.inStock ? `${p.stockCount} in stock` : 'Out of stock'}
                          </span>
                          {p.seller?.id === ADMIN_SELLER_ID && <span className="agrox-badge agrox-badge--admin">Admin</span>}
                          <button className="agrox-btn agrox-btn-outline agrox-btn-sm" onClick={() => { setEditing(p); setComposerOpen(true); }}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button className="agrox-btn agrox-btn-danger agrox-btn-sm" onClick={() => handleDelete(p)}>
                            <Trash2 size={13} /> {deleteCandidate === p.id ? 'Confirm?' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table. .agrox-table-wrap owns overflow-x and must not
                      also carry .hidden-mobile - that utility forces a display
                      value on which overflow has no effect, which clips the table
                      instead of scrolling it. */}
                  <div className="hidden-mobile">
                    <div className="agrox-table-wrap">
                      <table className="agrox-table">
                        <thead style={theadStyle}>
                          <tr>
                            <th style={{ fontWeight: 600 }}>Product</th>
                            <th style={{ fontWeight: 600 }}>Category</th>
                            <th style={{ fontWeight: 600 }}>Price</th>
                            <th style={{ fontWeight: 600 }}>Stock</th>
                            <th style={{ fontWeight: 600 }}>Seller</th>
                            <th style={{ fontWeight: 600 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  {p.image && (
                                    <img
                                      src={p.image}
                                      alt=""
                                      style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                                    />
                                  )}
                                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{p.category}</td>
                              <td style={{ fontWeight: 700, color: 'var(--color-action-primary)' }}>
                                {formatCurrency(p.price)}
                                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                  per {p.unit}
                                </div>
                              </td>
                              <td>
                                <span className={`agrox-badge ${p.inStock ? 'agrox-badge--success' : 'agrox-badge--error'}`}>
                                  {p.inStock ? p.stockCount : 'Out of stock'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>
                                {p.seller?.name}
                                {p.seller?.id === ADMIN_SELLER_ID && (
                                  <span className="agrox-badge agrox-badge--admin" style={{ marginLeft: '0.4rem' }}>
                                    Admin
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    className="agrox-btn agrox-btn-outline agrox-btn-sm"
                                    onClick={() => { setEditing(p); setComposerOpen(true); }}
                                  >
                                    <Pencil size={13} /> Edit
                                  </button>
                                  <button className="agrox-btn agrox-btn-danger agrox-btn-sm" onClick={() => handleDelete(p)}>
                                    <Trash2 size={13} /> {deleteCandidate === p.id ? 'Confirm?' : 'Delete'}
                                  </button>
                                </div>
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
          )}

          {/* ---------------- ORDERS ---------------- */}
          {activeTab === 'orders' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <span>Escrow Transactions ({filteredOrders.length})</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={adminOrdersOnly}
                    onChange={(e) => setAdminOrdersOnly(e.target.checked)}
                    style={{ accentColor: 'var(--color-action-primary)', width: '15px', height: '15px' }}
                  />
                  Admin listings only
                </label>
              </div>

              {loading ? (
                <div style={emptyStyle}>Loading transactions...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={emptyStyle}>No transactions found.</div>
              ) : (
                <>
                  <div className="visible-mobile" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredOrders.map((ord) => (
                      <div key={ord.id} style={mobileCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: 0, overflowWrap: 'anywhere' }}>{ord.reference}</span>
                          <StatusBadge status={ord.escrowStatus} />
                        </div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{ord.buyerName}</div>
                        <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>{ord.buyerEmail}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {ord.items.map((i, idx) => (
                            <div key={idx}>• {i.productName} (x{i.quantity})</div>
                          ))}
                        </div>
                        <div style={{ marginTop: '0.35rem', fontWeight: 800, color: 'var(--color-action-primary)', fontSize: '0.925rem' }}>
                          {formatCurrency(ord.totalAmount)}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                          {NEXT_STATUS[ord.escrowStatus] && (
                            <button
                              className="agrox-btn agrox-btn-outline agrox-btn-sm"
                              onClick={() => advanceOrder(ord, NEXT_STATUS[ord.escrowStatus]!.next)}
                            >
                              {NEXT_STATUS[ord.escrowStatus]!.label}
                            </button>
                          )}
                          <button className="agrox-btn agrox-btn-danger agrox-btn-sm" onClick={() => issueRefund(ord)}>
                            <Undo2 size={13} /> Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden-mobile">
                    <div className="agrox-table-wrap">
                      <table className="agrox-table">
                        <thead style={theadStyle}>
                          <tr>
                            <th style={{ fontWeight: 600 }}>Reference</th>
                            <th style={{ fontWeight: 600 }}>Buyer</th>
                            <th style={{ fontWeight: 600 }}>Items</th>
                            <th style={{ fontWeight: 600 }}>Amount</th>
                            <th style={{ fontWeight: 600 }}>Status</th>
                            <th style={{ fontWeight: 600 }}>Actions</th>
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
                                  <div key={idx}>
                                    <strong>{i.productName}</strong> (x{i.quantity})
                                    {i.listedByAdmin && (
                                      <span className="agrox-badge agrox-badge--admin" style={{ marginLeft: '0.4rem' }}>
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--color-action-primary)' }}>
                                {formatCurrency(ord.totalAmount)}
                              </td>
                              <td>
                                <StatusBadge status={ord.escrowStatus} />
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  {NEXT_STATUS[ord.escrowStatus] && (
                                    <button
                                      className="agrox-btn agrox-btn-outline agrox-btn-sm"
                                      onClick={() => advanceOrder(ord, NEXT_STATUS[ord.escrowStatus]!.next)}
                                    >
                                      {NEXT_STATUS[ord.escrowStatus]!.label}
                                    </button>
                                  )}
                                  <button className="agrox-btn agrox-btn-danger agrox-btn-sm" onClick={() => issueRefund(ord)}>
                                    <Undo2 size={13} /> Refund
                                  </button>
                                </div>
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
          )}

          {/* ---------------- REFUNDS ---------------- */}
          {activeTab === 'refunds' && (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>Refunds ({refunds.length})</div>

              {loading ? (
                <div style={emptyStyle}>Loading refunds...</div>
              ) : refunds.length === 0 ? (
                <div style={emptyStyle}>
                  <Undo2 size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>No refunds yet</h3>
                  <p style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>Issue one from the Orders tab.</p>
                </div>
              ) : (
                <div className="agrox-table-wrap">
                  <table className="agrox-table">
                    <thead style={theadStyle}>
                      <tr>
                        <th style={{ fontWeight: 600 }}>Order</th>
                        <th style={{ fontWeight: 600 }}>Amount</th>
                        <th style={{ fontWeight: 600 }}>Reason</th>
                        <th style={{ fontWeight: 600 }}>Status</th>
                        <th style={{ fontWeight: 600 }}>Paystack ID</th>
                        <th style={{ fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ fontWeight: 700 }}>{r.orderReference}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-error)' }}>{formatCurrency(r.amount)}</td>
                          <td style={{ fontSize: '0.85rem', whiteSpace: 'normal', maxWidth: '260px' }}>
                            {r.reason || '—'}
                            {r.adminNote && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                {r.adminNote}
                              </div>
                            )}
                          </td>
                          <td>
                            <RefundStatusBadge status={r.status} />
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {r.paystackRefundId || '—'}
                          </td>
                          <td>
                            {r.status !== 'processed' && (
                              <button className="agrox-btn agrox-btn-outline agrox-btn-sm" onClick={() => markRefundProcessed(r)}>
                                Mark Processed
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ---------------- SUPPORT ---------------- */}
          {activeTab === 'support' && (
            <div className="agrox-chat-inbox-grid" style={{ ...panelStyle, boxShadow: 'var(--shadow-sm)' }}>
              <div
                className="agrox-chat-thread-list"
                style={{
                  borderRight: '1px solid var(--color-border)',
                  flexDirection: 'column',
                  minWidth: 0,
                  minHeight: 0,
                  background: 'var(--color-surface-muted)',
                }}
              >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', fontWeight: 800, fontSize: '0.95rem' }}>
                  Conversations ({threads.length})
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {threads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      No conversations yet.
                    </div>
                  ) : (
                    threads.map((t) => {
                      const isSelected = activeThread?.id === t.id;
                      const isSupport = t.farmerId === ADMIN_SELLER_ID;
                      return (
                        <div
                          key={t.id}
                          onClick={() => openThread(t)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid var(--color-border)',
                            background: isSelected ? 'var(--color-surface)' : 'transparent',
                            cursor: 'pointer',
                            borderLeft: isSelected ? '4px solid var(--color-action-primary)' : '4px solid transparent',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.buyerName}
                            </div>
                            {isSupport && <span className="agrox-badge agrox-badge--info">Support</span>}
                          </div>
                          <div style={{ fontSize: '0.785rem', color: 'var(--color-action-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.productName || 'General'}
                          </div>
                          <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.lastMessage}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="agrox-chat-panel" style={{ flexDirection: 'column', minWidth: 0, minHeight: 0, background: 'var(--color-surface)' }}>
                {activeThread ? (
                  <>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.2 }}>{activeThread.buyerName}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                        Re: <strong>{activeThread.productName}</strong>
                      </div>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {messages.map((msg) => {
                        const isAdmin = msg.senderRole === 'admin';
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {isAdmin ? <ShieldCheck size={11} /> : msg.senderRole === 'farmer' ? <Store size={11} /> : <User size={11} />}
                              {msg.senderName} ({msg.senderRole})
                            </div>
                            <div
                              style={{
                                maxWidth: '85%',
                                padding: '0.75rem 1rem',
                                borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                background: isAdmin ? 'var(--primitive-green-900)' : 'var(--color-surface-muted)',
                                color: isAdmin ? '#FFFFFF' : 'var(--color-text-primary)',
                                fontSize: '0.875rem',
                                lineHeight: 1.45,
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={sendReply} style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        aria-label="Reply as AgroX Support"
                        placeholder="Reply as AgroX Support..."
                        className="agrox-input"
                        style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', background: 'var(--color-surface-muted)' }}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button type="submit" disabled={!replyText.trim() || sendingReply} className="agrox-btn agrox-btn-primary" style={{ flexShrink: 0 }}>
                        {sendingReply ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                        <span className="hidden-mobile">Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-secondary)' }}>
                    <MessageSquare size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select a conversation</h3>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductComposer
        open={composerOpen}
        initial={editing}
        sellers={knownSellers}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </PageShell>
  );
}
