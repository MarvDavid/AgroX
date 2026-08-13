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

export type EscrowStatus = 
  | 'pending'
  | 'paid_escrow_secured'
  | 'dispatched'
  | 'delivered'
  | 'escrow_released'
  | 'disputed';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  quantity: number;
  farmerId: string;
  farmerName: string;
}

export interface Order {
  id: string;
  reference: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  escrowStatus: EscrowStatus;
  paystackReference?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'farmer' | 'buyer';
  text: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  productId?: string;
  productName?: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  lastMessage?: string;
  updatedAt: string;
}

