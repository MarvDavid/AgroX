'use client';

import React, { useState, useEffect } from 'react';
import PageShell from '@/components/layout/PageShell';
import ChatDrawer from '@/components/chat/ChatDrawer';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Plus,
  CheckCircle2,
  Upload,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EscrowStatus, Product, Order } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { ASSIGNABLE_CATEGORIES } from '@/lib/constants';
import { SellerIdentity, deriveSellers, resolveSeller, setStoredSellerId } from '@/lib/seller-identity';

export default function SellerPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  // Derived from the sellers present in Postgres, not hardcoded.
  const [sellers, setSellers] = useState<SellerIdentity[]>([]);
  const [activeSeller, setActiveSeller] = useState<SellerIdentity | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<{ id: string; name: string; sellerId: string; sellerName: string } | null>(null);

  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    category: 'Fresh Produce',
    productTitle: '',
    price: '',
    unit: 'bag (50kg)',
    description: '',
    stockCount: '100',
    image: '',
    isOrganic: true,
  });

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    setLoading(true);
    try {
      const resProd = await fetch('/api/products');
      const dataProd = await resProd.json();

      if (dataProd.success && dataProd.products) {
        setProducts(dataProd.products);

        const available = deriveSellers(dataProd.products);
        setSellers(available);
        const seller = resolveSeller(dataProd.products);
        setActiveSeller(seller);

        if (seller) {
          setFormData((prev) => ({ ...prev, farmName: seller.name, location: seller.location }));
          const resOrd = await fetch(`/api/orders?farmerId=${encodeURIComponent(seller.id)}`);
          const dataOrd = await resOrd.json();
          if (dataOrd.success && dataOrd.orders) setOrders(dataOrd.orders);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.productTitle,
          category: formData.category,
          price: Number(formData.price),
          unit: formData.unit,
          description: formData.description,
          stockCount: Number(formData.stockCount),
          image: formData.image,
          isOrganic: formData.isOrganic,
          seller: activeSeller,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Previously this branch did nothing, so a rejected listing left the
        // modal open with no explanation at all.
        setFormError(data.error || 'Could not publish this listing.');
        return;
      }

      setSubmitted(true);
      setProducts((prev) => [data.product, ...prev]);
      setTimeout(() => {
        setSubmitted(false);
        setIsListingModalOpen(false);
        setFormData((prev) => ({
          ...prev,
          productTitle: '',
          price: '',
          description: '',
          image: '',
        }));
      }, 2000);
    } catch (err: any) {
      setFormError(err?.message || 'Could not publish this listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Produce Listings', icon: TrendingUp },
    { id: 'messages', label: 'Buyer Chat', icon: MessageSquare },
  ];

  // Only funded orders count as sales. Summing every order would count
  // abandoned, unpaid carts now that orders are created before payment.
  const FUNDED: EscrowStatus[] = ['paid_escrow_secured', 'dispatched', 'delivered', 'escrow_released'];
  const totalEscrowSales = orders
    .filter((o) => FUNDED.includes(o.escrowStatus))
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <PageShell muted wide>
        <div className="agrox-dash-grid">

          {/* Mobile Horizontal Tab Navigation */}
          <div className="agrox-tab-strip visible-mobile">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'messages') {
                      setChatProduct(null);
                      setIsChatOpen(true);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, paddingBottom: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>Farmer Portal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'messages') {
                        setChatProduct(null);
                        setIsChatOpen(true);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--primitive-green-100)' : 'transparent',
                      color: isActive ? 'var(--primitive-green-900)' : 'var(--color-text-secondary)',
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
          </aside>

          {/* Main Dashboard Area */}
          <div className="agrox-dash-main">

            {/* Header Action */}
            <div className="agrox-page-header" style={{ marginBottom: 0 }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, lineHeight: 1.25 }}>{activeSeller ? `Good morning, ${activeSeller.name}` : 'Farmer Portal'}</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Submit produce listings & manage buyer escrow shipments.</p>

                {/* Sellers come from the products table. Until real farmer
                    accounts exist, this is how the portal knows who it is
                    acting as - previously a hardcoded 's-101'. */}
                {sellers.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <label className="agrox-label" style={{ marginBottom: 0, fontSize: '0.75rem' }} htmlFor="seller-switch">
                      Acting as
                    </label>
                    <select
                      id="seller-switch"
                      className="agrox-input"
                      style={{ width: 'auto', maxWidth: '260px', fontSize: '0.8rem', paddingBlock: '0.35rem' }}
                      value={activeSeller?.id || ''}
                      onChange={(e) => {
                        const next = sellers.find((x) => x.id === e.target.value) || null;
                        if (!next) return;
                        setStoredSellerId(next.id);
                        setActiveSeller(next);
                        setFormData((prev) => ({ ...prev, farmName: next.name, location: next.location }));
                        fetchFarmerData();
                      }}
                    >
                      {sellers.map((x) => (
                        <option key={x.id} value={x.id}>{x.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    setChatProduct(null);
                    setIsChatOpen(true);
                  }}
                  className="agrox-btn agrox-btn-outline"
                >
                  <MessageSquare size={16} /> Chat Inbox
                </button>
                <button 
                  onClick={() => setIsListingModalOpen(true)}
                  className="agrox-btn agrox-btn-primary"
                >
                  <Plus size={16} /> List Produce
                </button>
              </div>
            </div>

            {/* Dashboard Cards */}
            {activeTab === 'dashboard' && (
              <>
                <div className="agrox-stat-grid" style={{ marginBottom: 0 }}>
                  <div className="agrox-stat-card">
                    <div className="agrox-stat-label">Escrow Secured Revenue</div>
                    <div className="agrox-stat-value">{formatCurrency(totalEscrowSales)}</div>
                  </div>
                  <div className="agrox-stat-card">
                    <div className="agrox-stat-label">Active Orders</div>
                    <div className="agrox-stat-value">{orders.length || 12}</div>
                  </div>
                  <div className="agrox-stat-card">
                    <div className="agrox-stat-label">Active Listings</div>
                    <div className="agrox-stat-value">{products.length}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(249, 168, 37, 0.1)', border: '1px solid rgba(249, 168, 37, 0.3)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={22} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Action Required</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                      Orders are waiting for freight dispatch. Update status to trigger buyer release.
                    </p>
                    <button 
                      onClick={() => setActiveTab('orders')} 
                      className="agrox-btn agrox-btn-outline"
                      style={{ marginTop: '0.65rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'var(--color-surface)' }}
                    >
                      Manage Orders →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="agrox-panel">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Buyer Escrow Orders</h3>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No orders received yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {orders.map((ord) => (
                      <div key={ord.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Ref: {ord.reference}</span>
                          <StatusBadge status={ord.escrowStatus} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Buyer: {ord.buyerName} ({ord.buyerEmail})</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.4rem', color: 'var(--color-action-primary)' }}>Amount: {formatCurrency(ord.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produce Listings Tab */}
            {activeTab === 'products' && (
              <div className="agrox-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.15rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Active Farm Produce ({products.length})</h3>
                  <button onClick={() => setIsListingModalOpen(true)} className="agrox-btn agrox-btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}>
                    <Plus size={16} /> Add Listing
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', background: 'var(--color-surface-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.25rem', overflowWrap: 'anywhere' }}>{p.name}</div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)' }}>{p.category}</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-action-primary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>{formatCurrency(p.price)} / {p.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      {/* Product Listing Modal */}
      {isListingModalOpen && (
        <>
          <div className="agrox-drawer-backdrop" onClick={() => !submitted && setIsListingModalOpen(false)} style={{ zIndex: 'var(--z-modal-backdrop)' }} />
          <div className="agrox-modal" role="dialog" aria-modal="true" aria-label="List produce to buyer marketplace">
            {submitted ? (
              <div className="agrox-modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Listing Published Live!</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  Your farm produce has been published to the buyer catalog & API.
                </p>
              </div>
            ) : (
              <>
                <div className="agrox-modal-header">
                  <h3 className="agrox-modal-title">List Produce to Buyer Marketplace</h3>
                  <button type="button" onClick={() => setIsListingModalOpen(false)} className="agrox-modal-close" aria-label="Close listing form">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleListingSubmit} className="agrox-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <label className="agrox-label">Category</label>
                      <select className="agrox-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                        {/* Was a hardcoded copy of this list that could drift from lib/data.ts. */}
                        {ASSIGNABLE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label className="agrox-label">Product Title</label>
                      <input type="text" required placeholder="e.g. Organic Sweet Yellow Maize" className="agrox-input" value={formData.productTitle} onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <label className="agrox-label">Price (NGN ₦)</label>
                      <input type="number" required placeholder="35000" className="agrox-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label className="agrox-label">Unit Packaging</label>
                      <input type="text" required placeholder="bag (50kg)" className="agrox-input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                    </div>
                  </div>

                  {/* These three lived in formData with no UI at all, so every
                      listing shipped with the same stock photo and 100 units. */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <label className="agrox-label">Stock Quantity</label>
                      <input type="number" required min={0} placeholder="100" className="agrox-input" value={formData.stockCount} onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })} />
                    </div>
                    <div style={{ minWidth: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.55rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isOrganic}
                          onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                          style={{ accentColor: 'var(--color-success)', width: '16px', height: '16px' }}
                        />
                        Certified organic
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="agrox-label">Product Image URL</label>
                    <input type="url" placeholder="https://..." className="agrox-input" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Listing preview"
                        style={{ marginTop: '0.5rem', width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                        Leave blank to use a generic placeholder image.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="agrox-label">Harvest Description & Moisture Level</label>
                    <textarea rows={3} required placeholder="Sun-dried yellow maize, 12% moisture level, high quality." className="agrox-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        background: 'rgba(211, 47, 47, 0.1)', color: 'var(--color-error)',
                        borderRadius: 'var(--radius-md)', padding: '0.7rem 0.85rem',
                        fontSize: '0.825rem', fontWeight: 600, lineHeight: 1.45,
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{formError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <button type="button" onClick={() => setIsListingModalOpen(false)} className="agrox-btn" style={{ flex: 1, background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)' }}>Cancel</button>
                    <button type="submit" disabled={submitting} className="agrox-btn agrox-btn-primary" style={{ flex: 2 }}>
                      {submitting ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />} Publish Listing
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </>
      )}

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetProduct={chatProduct}
        currentUser={{ id: activeSeller?.id || 'farmer-unassigned', name: activeSeller?.name || 'Farmer', role: 'farmer' }}
      />
    </PageShell>
  );
}
