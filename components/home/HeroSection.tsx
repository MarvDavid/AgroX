'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Users } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="agrox-container">
      <div className="agrox-hero">
        <div className="agrox-hero-grid">
          <div style={{ minWidth: 0 }}>
            <div className="agrox-marquee">
              <div className="agrox-marquee-track">
                🌾 Direct Farm-to-Buyer Marketplace &nbsp;&bull;&nbsp; Fresh Agro Produce & Machinery
              </div>
            </div>
            <h1 className="agrox-hero-title">
              Fresh Agro Produce & Machinery directly from Source.
            </h1>
            <p className="agrox-hero-subtitle">
              AgroX connects certified commercial farmers, equipment manufacturers, and bulk produce buyers with transparent pricing and fast logistics.
            </p>

            <div className="agrox-hero-cta">
              <a href="#products" className="agrox-btn" style={{ background: 'var(--color-accent)', color: 'var(--primitive-charcoal-900)' }}>
                Browse Catalog <ArrowRight size={18} />
              </a>
              <Link href="/seller" className="agrox-btn agrox-btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--primitive-white)', borderColor: 'rgba(255,255,255,0.3)' }}>
                Sell Produce
              </Link>
            </div>

            {/* Quick stats */}
            <div className="agrox-hero-stats">
              <div>
                <div className="agrox-hero-stat-value">5,000+</div>
                <div className="agrox-hero-stat-label">Verified Farmers</div>
              </div>
              <div>
                <div className="agrox-hero-stat-value">100%</div>
                <div className="agrox-hero-stat-label">Quality Guarantee</div>
              </div>
              <div>
                <div className="agrox-hero-stat-value">24-48 hrs</div>
                <div className="agrox-hero-stat-label">Fast Logistics</div>
              </div>
            </div>
          </div>

          <div className="agrox-hero-media">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000"
              alt="Golden Wheat & Farm Field"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
