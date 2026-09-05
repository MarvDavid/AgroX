import { ProductCategory } from '@/types';

// Catalogue data lives in Postgres. The MOCK_PRODUCTS array that used to sit
// here was served by lib/db.ts whenever a query failed or returned zero rows,
// which made an empty database look populated and put 12 un-editable phantom
// listings in the admin console.
//
// CATEGORIES is not data - it is the UI enum backing the ProductCategory type
// and the category filter, so it stays.

export const CATEGORIES = [
  'All',
  'Fresh Produce',
  'Grains & Cereals',
  'Seeds & Seedlings',
  'Fertilizers & Soil',
  'Farm Equipment',
  'Livestock & Poultry'
] as const;
