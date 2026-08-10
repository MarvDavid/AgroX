'use client';

import React, { useState } from 'react';
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
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState('disputes');

  const navItems = [
    { id: 'dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'disputes', label: 'Dispute Management', icon: ShieldAlert },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const mockDisputes = [
    { id: 'DSP-1029', buyer: 'Grace Okon', seller: 'SunValley Farms', issue: 'Underweight Delivery', amount: 45000, status: 'pending', date: '2 hrs ago' },
    { id: 'DSP-1028', buyer: 'Ahmed Bello', seller: 'Oyo Grains Co', issue: 'Damaged Goods (Moisture)', amount: 120000, status: 'investigating', date: '5 hrs ago' },
    { id: 'DSP-1027', buyer: 'Chioma Eze', seller: 'GreenLife Agro', issue: 'Late Delivery > 48hrs', amount: 85000, status: 'resolved', date: '1 day ago' },
  ];

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
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Dispute Management</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Review and mediate escrow holds between buyers and farmers.</p>
              </div>
              
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search dispute ID..." 
                  className="agrox-search-input" 
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>

            {/* Dispute Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Active Disputes</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-error)' }}>24</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Funds in Escrow Hold</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>₦3,450,000</div>
              </div>
              <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Avg. Resolution Time</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>18 hrs</div>
              </div>
            </div>

            {/* Dispute Table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Case ID</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Involved Parties</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Issue Type</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Escrow Amount</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDisputes.map((dispute) => (
                      <tr key={dispute.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{dispute.id}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{dispute.buyer}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>vs {dispute.seller}</div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>{dispute.issue}</td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>₦{dispute.amount.toLocaleString()}</td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          {dispute.status === 'pending' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(249, 168, 37, 0.1)', color: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                              <AlertTriangle size={12} /> Pending
                            </span>
                          )}
                          {dispute.status === 'investigating' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                              <Search size={12} /> Reviewing
                            </span>
                          )}
                          {dispute.status === 'resolved' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(67, 160, 71, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                              <CheckCircle2 size={12} /> Resolved
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <button style={{ color: 'var(--color-text-secondary)' }}><MoreVertical size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
