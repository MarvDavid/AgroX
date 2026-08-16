'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatDrawer from '@/components/chat/ChatDrawer';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Truck, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Upload,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Product, Order } from '@/types';

export default function SellerPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<{ id: string; name: string; sellerId: string; sellerName: string } | null>(null);

  const [formData, setFormData] = useState({
    farmName: 'SunValley Grain Farms',
    location: 'Oyo State, Nigeria',
    category: 'Fresh Produce',
    productTitle: '',
    price: '',
    unit: 'bag (50kg)',
    description: '',
    stockCount: '100',
    image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800',
    isOrganic: true,
  });

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    setLoading(true);
    try {
      const [resProd, resOrd] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders?farmerId=s-101'),
      ]);
      const dataProd = await resProd.json();
      const dataOrd = await resOrd.json();

      if (dataProd.success && dataProd.products) {
        setProducts(dataProd.products);
      }
      if (dataOrd.success && dataOrd.orders) {
        setOrders(dataOrd.orders);
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
          seller: {
            id: 's-101',
            name: formData.farmName,
            location: formData.location,
            verified: true,
            rating: 4.9,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setSubmitted(true);
        setProducts((prev) => [data.product, ...prev]);
        setTimeout(() => {
          setSubmitted(false);
          setIsListingModalOpen(false);
          setFormData({
            ...formData,
            productTitle: '',
            price: '',
            description: '',
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Error listing product:', err);
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

  const totalEscrowSales = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-muted)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '1.5rem 0' }} className="agrox-container">
        <div className="agrox-seller-grid">
          
          {/* Mobile Horizontal Tab Navigation */}
          <div className="agrox-tab-strip visible-mobile" style={{ marginBottom: '0.5rem' }}>
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
          <aside className="agrox-seller-sidebar hidden-mobile">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>Farmer Portal</h2>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, lineHeight: 1.25 }}>Good morning, SunValley Farms</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Submit produce listings & manage buyer escrow shipments.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: 'auto' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Escrow Secured Revenue</div>
                    <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800, wordBreak: 'break-word' }}>{formatCurrency(totalEscrowSales || 1450000)}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Active Orders</div>
                    <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800 }}>{orders.length || 12}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>Active Listings</div>
                    <div style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 800 }}>{products.length}</div>
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
              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Buyer Escrow Orders</h3>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No orders received yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {orders.map((ord) => (
                      <div key={ord.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.925rem' }}>Ref: {ord.reference}</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.8rem' }}>{ord.escrowStatus.toUpperCase()}</span>
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
              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.15rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Active Farm Produce ({products.length})</h3>
                  <button onClick={() => setIsListingModalOpen(true)} className="agrox-btn agrox-btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}>
                    <Plus size={16} /> Add Listing
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', background: 'var(--color-surface-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.25rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)' }}>{p.category}</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-action-primary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>{formatCurrency(p.price)} / {p.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Product Listing Modal */}
      {isListingModalOpen && (
        <>
          <div className="agrox-drawer-backdrop" onClick={() => !submitted && setIsListingModalOpen(false)} style={{ zIndex: 110 }} />
          <div className="agrox-modal-content">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Listing Published Live!</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  Your farm produce has been published to the buyer catalog & API.
                </p>
              </div>
            ) : (
              <form onSubmit={handleListingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                  List Produce to Buyer Marketplace
                </h3>
                
                <div className="agrox-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>Category</label>
                    <select className="agrox-search-input" style={{ paddingLeft: '0.85rem' }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option>Fresh Produce</option>
                      <option>Grains & Cereals</option>
                      <option>Seeds & Seedlings</option>
                      <option>Fertilizers & Soil</option>
                      <option>Farm Equipment</option>
                      <option>Livestock & Poultry</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>Product Title</label>
                    <input type="text" required placeholder="e.g. Organic Sweet Yellow Maize" className="agrox-search-input" style={{ paddingLeft: '0.85rem' }} value={formData.productTitle} onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })} />
                  </div>
                </div>

                <div className="agrox-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>Price (NGN ₦)</label>
                    <input type="number" required placeholder="35000" className="agrox-search-input" style={{ paddingLeft: '0.85rem' }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>Unit Packaging</label>
                    <input type="text" required placeholder="bag (50kg)" className="agrox-search-input" style={{ paddingLeft: '0.85rem' }} value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.3rem' }}>Harvest Description & Moisture Level</label>
                  <textarea rows={3} required placeholder="Sun-dried yellow maize, 12% moisture level, high quality." className="agrox-search-input" style={{ paddingLeft: '0.85rem', borderRadius: 'var(--radius-md)', height: 'auto' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <button type="button" onClick={() => setIsListingModalOpen(false)} className="agrox-btn" style={{ flex: 1, background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)' }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="agrox-btn agrox-btn-primary" style={{ flex: 2 }}>
                    {submitting ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />} Publish Listing
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      <Footer />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetProduct={chatProduct}
        currentUser={{ id: 's-101', name: 'SunValley Grain Farms', role: 'farmer' }}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .agrox-seller-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        .agrox-seller-sidebar {
          background: var(--color-surface);
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          height: fit-content;
        }
        .agrox-modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 94%;
          max-width: 640px;
          max-height: 90vh;
          overflow-y: auto;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          z-index: 111;
          box-shadow: var(--shadow-xl);
        }
        @media(min-width: 768px) {
          .agrox-modal-content {
            padding: 2rem;
          }
        }
        @media(min-width: 992px) {
          .agrox-seller-grid {
            grid-template-columns: 240px 1fr;
            gap: 2rem;
          }
          .agrox-seller-sidebar {
            position: sticky;
            top: 5.5rem;
          }
        }
      `}} />
    </div>
  );
}
