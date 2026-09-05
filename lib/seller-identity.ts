'use client';

import { Product } from '@/types';
import { ADMIN_SELLER_ID } from './constants';

/**
 * Which seller the farmer portal is acting as.
 *
 * There is no users table, so this cannot be looked up by account - but it does
 * not need to be invented either. The distinct sellers are derived from the
 * products already in Postgres, and the chosen one is remembered per browser.
 * This replaces a hardcoded 's-101' / "SunValley Grain Farms" that appeared in
 * the portal header, the listing form and the chat identity.
 *
 * Replace this wholesale when real farmer accounts land.
 */

const STORAGE_KEY = 'agrox_seller_identity';

export type SellerIdentity = Product['seller'];

/**
 * Distinct farmer sellers in the catalogue, in first-seen order.
 *
 * The AgroX Admin house identity is excluded: the farmer portal must never act
 * as it. Products are ordered newest-first, so without this filter a recent
 * admin listing would become the portal's default identity - and every listing
 * it then submitted would be rejected with 403 by the guard on
 * POST /api/products, which only lets an authenticated admin publish as
 * AgroX Admin.
 */
export function deriveSellers(products: Product[]): SellerIdentity[] {
  const byId = new Map<string, SellerIdentity>();
  for (const p of products) {
    if (!p.seller?.id) continue;
    if (p.seller.id === ADMIN_SELLER_ID) continue;
    if (!byId.has(p.seller.id)) byId.set(p.seller.id, p.seller);
  }
  return Array.from(byId.values());
}

export function getStoredSellerId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSellerId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage unavailable; the selection still applies to this page view.
  }
}

/**
 * Resolves the active seller: the remembered one if it still exists in the
 * catalogue, otherwise the first available. Returns null when the catalogue has
 * no sellers yet, so callers can prompt rather than fabricate one.
 */
export function resolveSeller(products: Product[]): SellerIdentity | null {
  const sellers = deriveSellers(products);
  if (sellers.length === 0) return null;

  const storedId = getStoredSellerId();
  return sellers.find((s) => s.id === storedId) || sellers[0];
}
