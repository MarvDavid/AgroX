'use client';

/**
 * Per-browser buyer identity.
 *
 * The app has no accounts: every screen hardcoded the same demo buyer
 * ('buyer-001', john@agricbuyer.com). That is fine for a catalogue demo, but it
 * breaks the moment buyers talk to support, because createOrGetChatThread keys
 * on the buyer id - every customer's support request would land in one shared
 * conversation that they could all read.
 *
 * This is not authentication and does not pretend to be. It is a stable local id
 * so conversations and orders belong to one browser, and it is designed to be
 * replaced wholesale by real auth later.
 */

const STORAGE_KEY = 'agrox_buyer_identity';

export interface BuyerIdentity {
  id: string;
  name: string;
  email: string;
}

/** Demo values, kept so the seeded dashboard data still has something to show. */
export const DEMO_BUYER: BuyerIdentity = {
  id: 'buyer-001',
  name: 'John Doe Enterprise',
  email: 'john@agricbuyer.com',
};

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `buyer-${crypto.randomUUID().slice(0, 12)}`;
  }
  return `buyer-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function getBuyerIdentity(): BuyerIdentity {
  // Server render and private-mode failures both fall back to the demo identity
  // rather than throwing.
  if (typeof window === 'undefined') return DEMO_BUYER;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BuyerIdentity>;
      if (parsed?.id) {
        return {
          id: parsed.id,
          name: parsed.name || DEMO_BUYER.name,
          email: parsed.email || DEMO_BUYER.email,
        };
      }
    }

    const created: BuyerIdentity = { ...DEMO_BUYER, id: randomId() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
    return created;
  } catch {
    return DEMO_BUYER;
  }
}

/** Called at checkout, so orders and conversations line up with a real name and email. */
export function setBuyerIdentity(patch: Partial<Omit<BuyerIdentity, 'id'>>): BuyerIdentity {
  const current = getBuyerIdentity();
  const next: BuyerIdentity = {
    id: current.id,
    name: patch.name?.trim() || current.name,
    email: patch.email?.trim().toLowerCase() || current.email,
  };

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Storage unavailable; the identity is still correct for this page view.
  }

  return next;
}
