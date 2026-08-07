export type ProductCategory = 
  | 'All'
  | 'Fresh Produce'
  | 'Grains & Cereals'
  | 'Seeds & Seedlings'
  | 'Fertilizers & Soil'
  | 'Farm Equipment'
  | 'Livestock & Poultry';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  unit: string; // e.g., 'kg', 'bag (50kg)', 'piece', 'crate'
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  seller: {
    id: string;
    name: string;
    location: string;
    verified: boolean;
    rating: number;
  };
  inStock: boolean;
  stockCount: number;
  isOrganic?: boolean;
  featured?: boolean;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductFilterState {
  category: ProductCategory;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  organicOnly: boolean;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating';
}
