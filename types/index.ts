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
  /** Created from the admin console. Survives an override of `seller`, so a
   *  platform listing attributed to a real farmer is still traceable. */
  listedByAdmin?: boolean;
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
  | 'disputed'
  | 'refund_pending'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  quantity: number;
  farmerId: string;
  farmerName: string;
  /** Snapshotted at order time. Orders store items as JSONB, so the admin order
   *  view cannot join back to products - without this, an admin listing
   *  attributed to a real farmer would be invisible to the admin. */
  listedByAdmin?: boolean;
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
  senderRole: 'farmer' | 'buyer' | 'admin';
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


export type RefundStatus =
  | 'requested'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'manual_pending';

export interface Refund {
  id: string;
  orderId: string;
  orderReference: string;
  paystackReference?: string;
  /** Naira, matching Order.totalAmount. Converted to kobo only at the Paystack boundary. */
  amount: number;
  reason: string;
  status: RefundStatus;
  paystackRefundId?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
