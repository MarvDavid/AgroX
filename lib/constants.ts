import { Product, ProductCategory } from '@/types';
import { CATEGORIES } from './data';

/**
 * The platform's own seller identity.
 *
 * Listings created from the admin console are attributed here by default, so
 * AgroX can sell directly alongside the farmers on the marketplace. The admin
 * composer can override the attribution to a real farmer per product; when it
 * does, `listedByAdmin` on the product (and on the snapshotted order item) is
 * what preserves the provenance.
 */
export const ADMIN_SELLER_ID = 's-admin';

export const ADMIN_SELLER: Product['seller'] = {
  id: ADMIN_SELLER_ID,
  name: 'AgroX Admin',
  location: 'Lagos, Nigeria',
  verified: true,
  rating: 5.0,
};

/** Identity the admin posts under in support conversations. */
export const ADMIN_SUPPORT_NAME = 'AgroX Support';

/**
 * Categories a product can actually belong to.
 *
 * 'All' is a storefront filter option, not a real category, so it is excluded.
 * Typed as ProductCategory[] rather than letting the filter narrow the element
 * type, which would make `.includes(someProductCategory)` a type error.
 */
export const ASSIGNABLE_CATEGORIES: ProductCategory[] = CATEGORIES.filter(
  (c) => c !== 'All'
) as ProductCategory[];
