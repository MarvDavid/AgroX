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

      <main style={{ flex: 1, padding: '2rem 0' }} className="agrox-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="agrox-seller-grid">
          
          {/* Sidebar Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>Farmer Portal</h2>
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
                    padding: '0.75rem 1rem',
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

          {/* Main Dashboard Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Good morning, SunValley Farms</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Submit produce listings & manage buyer escrow shipments.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => {
                    setChatProduct(null);
                    setIsChatOpen(true);
                  }}
                  className="agrox-btn agrox-btn-outline"
                >
                  <MessageSquare size={18} /> Chat Inbox
                </button>
                <button 
                  onClick={() => setIsListingModalOpen(true)}
                  className="agrox-btn agrox-btn-primary"
                >
                  <Plus size={18} /> List New Product
                </button>
              </div>
            </div>

            {/* Dashboard Cards */}
            {activeTab === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Escrow Secured Revenue</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(totalEscrowSales || 1450000)}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Active Orders</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{orders.length || 12}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Active Listings</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{products.length}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(249, 168, 37, 0.1)', border: '1px solid rgba(249, 168, 37, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Action Required</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Orders are waiting for freight dispatch. Update status to trigger buyer release.
                    </p>
                    <button onClick={() => setActiveTab('orders')} style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-action-primary)', background: 'transparent' }}>
                      Manage Orders →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Buyer Escrow Orders</h3>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>No orders received yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map((ord) => (
                      <div key={ord.id} style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800 }}>Ref: {ord.reference}</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{ord.escrowStatus.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Buyer: {ord.buyerName} ({ord.buyerEmail})</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem' }}>Amount: {formatCurrency(ord.totalAmount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produce Listings Tab */}
            {activeTab === 'products' && (
              <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Active Farm Produce Listings ({products.length})</h3>
                  <button onClick={() => setIsListingModalOpen(true)} className="agrox-btn agrox-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Listing
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {products.map((p) => (
                    <div key={p.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--color-surface-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{p.category}</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-action-primary)' }}>{formatCurrency(p.price)} / {p.unit}</div>
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
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', zIndex: 111, boxShadow: 'var(--shadow-xl)'
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Listing Published Live!</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0.75rem 0' }}>
                  Your farm produce has been published to the buyer catalog & API.
                </p>
              </div>
            ) : (
              <form onSubmit={handleListingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  List Produce to Buyer Marketplace
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                    <select className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option>Fresh Produce</option>
                      <option>Grains & Cereals</option>
                      <option>Seeds & Seedlings</option>
                      <option>Fertilizers & Soil</option>
                      <option>Farm Equipment</option>
                      <option>Livestock & Poultry</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Product Title</label>
                    <input type="text" required placeholder="e.g. Organic Sweet Yellow Maize" className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.productTitle} onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Price (NGN ₦)</label>
                    <input type="number" required placeholder="35000" className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit Packaging</label>
                    <input type="text" required placeholder="bag (50kg)" className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Harvest Description & Moisture Level</label>
                  <textarea rows={3} required placeholder="Sun-dried yellow maize, 12% moisture level, high quality." className="agrox-search-input" style={{ paddingLeft: '1rem', borderRadius: 'var(--radius-md)', height: 'auto' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsListingModalOpen(false)} className="agrox-btn" style={{ flex: 1, background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)' }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="agrox-btn agrox-btn-primary" style={{ flex: 2 }}>
                    {submitting ? <RefreshCw size={18} className="spin" /> : <Upload size={18} />} Publish Listing
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
        .agrox-seller-grid { grid-template-columns: 1fr; }
        @media(min-width: 992px) { .agrox-seller-grid { grid-template-columns: 250px 1fr; } }
      `}} />
    </div>
  );
}
