import { Product, Order, ChatMessage, ChatThread, EscrowStatus } from '@/types';
import { MOCK_PRODUCTS } from './data';
import { supabase, isSupabaseConfigured } from './supabase';

// Local storage / Memory fallback state
let inMemoryProducts: Product[] = [...MOCK_PRODUCTS];

let inMemoryOrders: Order[] = [
  {
    id: 'ord-1001',
    reference: 'AGX-782194',
    buyerName: 'John Doe Enterprise',
    buyerEmail: 'john@agricbuyer.com',
    buyerPhone: '+234 803 123 4567',
    shippingAddress: 'Plot 4, Central Grain Depot, Ikeja, Lagos',
    items: [
      {
        productId: 'ag-1',
        productName: 'Organic Fresh Yellow Maize',
        price: 35000,
        unit: 'bag (50kg)',
        quantity: 5,
        farmerId: 's-101',
        farmerName: 'SunValley Grain Farms',
      },
    ],
    totalAmount: 175000,
    escrowStatus: 'paid_escrow_secured',
    paystackReference: 'pstk_test_9081237192',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'ord-1002',
    reference: 'AGX-551982',
    buyerName: 'AgroMart Supermarket',
    buyerEmail: 'procurement@agromart.ng',
    buyerPhone: '+234 809 987 6543',
    shippingAddress: 'Victoria Island Central Store, Lagos',
    items: [
      {
        productId: 'ag-2',
        productName: 'Fresh Harvest Roma Tomatoes',
        price: 25000,
        unit: 'basket (25kg)',
        quantity: 10,
        farmerId: 's-102',
        farmerName: 'GreenField Produce Co.',
      },
    ],
    totalAmount: 250000,
    escrowStatus: 'dispatched',
    paystackReference: 'pstk_test_481029412',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

let inMemoryChats: ChatThread[] = [
  {
    id: 'chat-1',
    productId: 'ag-1',
    productName: 'Organic Fresh Yellow Maize',
    buyerId: 'buyer-001',
    buyerName: 'John Doe Enterprise',
    farmerId: 's-101',
    farmerName: 'SunValley Grain Farms',
    lastMessage: 'Is the 12% moisture content guaranteed for 500 bags?',
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'chat-2',
    productId: 'ag-2',
    productName: 'Fresh Harvest Roma Tomatoes',
    buyerId: 'buyer-002',
    buyerName: 'AgroMart Supermarket',
    farmerId: 's-102',
    farmerName: 'GreenField Produce Co.',
    lastMessage: 'Logistics truck will arrive at 8:00 AM for inspection.',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

let inMemoryMessages: ChatMessage[] = [
  {
    id: 'msg-101',
    chatId: 'chat-1',
    senderId: 'buyer-001',
    senderName: 'John Doe Enterprise',
    senderRole: 'buyer',
    text: 'Hello SunValley! We want to negotiate bulk pricing for 500 bags of Yellow Maize.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-102',
    chatId: 'chat-1',
    senderId: 's-101',
    senderName: 'SunValley Grain Farms',
    senderRole: 'farmer',
    text: 'Hello! Yes, we can offer a 5% discount for orders above 300 bags. All bags are moisture tested.',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'msg-103',
    chatId: 'chat-1',
    senderId: 'buyer-001',
    senderName: 'John Doe Enterprise',
    senderRole: 'buyer',
    text: 'Is the 12% moisture content guaranteed for 500 bags?',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

// Mapper utilities
function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    unit: row.unit,
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || 0),
    image: row.image,
    description: row.description,
    seller: typeof row.seller === 'string' ? JSON.parse(row.seller) : row.seller,
    inStock: Boolean(row.in_stock),
    stockCount: Number(row.stock_count || 0),
    isOrganic: Boolean(row.is_organic),
    featured: Boolean(row.featured),
    tags: row.tags || [],
  };
}

function mapDbOrder(row: any): Order {
  return {
    id: row.id,
    reference: row.reference,
    buyerName: row.buyer_name || row.buyerName,
    buyerEmail: row.buyer_email || row.buyerEmail,
    buyerPhone: row.buyer_phone || row.buyerPhone,
    shippingAddress: row.shipping_address || row.shippingAddress,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    totalAmount: Number(row.total_amount || row.totalAmount),
    escrowStatus: row.escrow_status || row.escrowStatus || 'paid_escrow_secured',
    paystackReference: row.paystack_reference || row.paystackReference,
    createdAt: row.created_at || row.createdAt,
  };
}

function mapDbChat(row: any): ChatThread {
  return {
    id: row.id,
    productId: row.product_id || row.productId,
    productName: row.product_name || row.productName,
    buyerId: row.buyer_id || row.buyerId,
    buyerName: row.buyer_name || row.buyerName,
    farmerId: row.farmer_id || row.farmerId,
    farmerName: row.farmer_name || row.farmerName,
    lastMessage: row.last_message || row.lastMessage,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

function mapDbMessage(row: any): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id || row.chatId,
    senderId: row.sender_id || row.senderId,
    senderName: row.sender_name || row.senderName,
    senderRole: row.sender_role || row.senderRole,
    text: row.text,
    createdAt: row.created_at || row.createdAt,
  };
}

/* PRODUCTS CRUD */
export async function getProducts(category?: string, query?: string): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      let q = supabase.from('products').select('*');
      if (category && category !== 'All') {
        q = q.eq('category', category);
      }
      if (query) {
        q = q.ilike('name', `%${query}%`);
      }
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbProduct);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetch products fallback to memory:', e);
    }
  }

  // Memory fallback
  return inMemoryProducts.filter((product) => {
    if (category && category !== 'All' && product.category !== category) {
      return false;
    }
    if (query && query.trim() !== '') {
      const qStr = query.toLowerCase();
      const matchName = product.name.toLowerCase().includes(qStr);
      const matchCategory = product.category.toLowerCase().includes(qStr);
      const matchDesc = product.description.toLowerCase().includes(qStr);
      if (!matchName && !matchCategory && !matchDesc) return false;
    }
    return true;
  });
}

export async function addProduct(newProductData: Omit<Product, 'id'>): Promise<Product> {
  const newProduct: Product = {
    ...newProductData,
    id: `ag-${Date.now()}`,
  };

  if (isSupabaseConfigured) {
    try {
      const rowToInsert = {
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        original_price: newProduct.originalPrice,
        unit: newProduct.unit,
        rating: newProduct.rating,
        reviews_count: newProduct.reviewsCount,
        image: newProduct.image,
        description: newProduct.description,
        seller: newProduct.seller,
        in_stock: newProduct.inStock,
        stock_count: newProduct.stockCount,
        is_organic: newProduct.isOrganic,
        featured: newProduct.featured,
        tags: newProduct.tags,
      };

      const { data, error } = await supabase.from('products').insert([rowToInsert]).select().single();
      if (!error && data) {
        const mapped = mapDbProduct(data);
        inMemoryProducts.unshift(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase add product fallback to memory:', e);
    }
  }

  inMemoryProducts.unshift(newProduct);
  return newProduct;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

/* ORDERS CRUD */
export async function getOrders(farmerId?: string, buyerEmail?: string): Promise<Order[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data && data.length > 0) {
        let res = data.map(mapDbOrder);
        if (farmerId) {
          res = res.filter((o) => o.items.some((i) => i.farmerId === farmerId));
        }
        if (buyerEmail) {
          res = res.filter((o) => o.buyerEmail === buyerEmail);
        }
        return res;
      }
    } catch (e) {
      console.warn('Supabase fetch orders fallback:', e);
    }
  }

  let res = [...inMemoryOrders];
  if (farmerId) {
    res = res.filter((o) => o.items.some((i) => i.farmerId === farmerId));
  }
  if (buyerEmail) {
    res = res.filter((o) => o.buyerEmail === buyerEmail);
  }
  return res;
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const rowToInsert = {
        id: newOrder.id,
        reference: newOrder.reference,
        buyer_name: newOrder.buyerName,
        buyer_email: newOrder.buyerEmail,
        buyer_phone: newOrder.buyerPhone,
        shipping_address: newOrder.shippingAddress,
        items: newOrder.items,
        total_amount: newOrder.totalAmount,
        escrow_status: newOrder.escrowStatus,
        paystack_reference: newOrder.paystackReference,
      };

      const { data, error } = await supabase.from('orders').insert([rowToInsert]).select().single();
      if (!error && data) {
        const mapped = mapDbOrder(data);
        inMemoryOrders.unshift(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase create order fallback:', e);
    }
  }

  inMemoryOrders.unshift(newOrder);
  return newOrder;
}

export async function updateOrderStatus(reference: string, escrowStatus: EscrowStatus): Promise<Order | null> {
  let targetOrder = inMemoryOrders.find((o) => o.reference === reference || o.paystackReference === reference);
  if (targetOrder) {
    targetOrder.escrowStatus = escrowStatus;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ escrow_status: escrowStatus })
        .or(`reference.eq.${reference},paystack_reference.eq.${reference}`)
        .select()
        .single();

      if (!error && data) {
        return mapDbOrder(data);
      }
    } catch (e) {
      console.warn('Supabase update order fallback:', e);
    }
  }

  return targetOrder || null;
}

/* CHATS CRUD */
export async function getChats(userId?: string): Promise<ChatThread[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('chats').select('*');
      if (!error && data && data.length > 0) {
        return data.map(mapDbChat);
      }
    } catch (e) {
      console.warn('Supabase get chats fallback:', e);
    }
  }

  return [...inMemoryChats];
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(mapDbMessage);
      }
    } catch (e) {
      console.warn('Supabase get messages fallback:', e);
    }
  }

  return inMemoryMessages.filter((m) => m.chatId === chatId);
}

export async function sendChatMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'farmer' | 'buyer',
  text: string
): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    chatId,
    senderId,
    senderName,
    senderRole,
    text,
    createdAt: new Date().toISOString(),
  };

  inMemoryMessages.push(newMsg);

  // Update chat thread last message
  const thread = inMemoryChats.find((c) => c.id === chatId);
  if (thread) {
    thread.lastMessage = text;
    thread.updatedAt = newMsg.createdAt;
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('messages').insert([{
        id: newMsg.id,
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        text,
      }]);

      await supabase.from('chats').update({ last_message: text, updated_at: newMsg.createdAt }).eq('id', chatId);
    } catch (e) {
      console.warn('Supabase send message fallback:', e);
    }
  }

  return newMsg;
}

export async function createOrGetChatThread(
  productId: string,
  productName: string,
  buyerId: string,
  buyerName: string,
  farmerId: string,
  farmerName: string
): Promise<ChatThread> {
  let existing = inMemoryChats.find(
    (c) => c.productId === productId && c.buyerId === buyerId && c.farmerId === farmerId
  );
  if (existing) return existing;

  const newThread: ChatThread = {
    id: `chat-${Date.now()}`,
    productId,
    productName,
    buyerId,
    buyerName,
    farmerId,
    farmerName,
    lastMessage: 'Conversation started',
    updatedAt: new Date().toISOString(),
  };

  inMemoryChats.unshift(newThread);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('chats').insert([{
        id: newThread.id,
        product_id: productId,
        product_name: productName,
        buyer_id: buyerId,
        buyer_name: buyerName,
        farmer_id: farmerId,
        farmer_name: farmerName,
        last_message: newThread.lastMessage,
      }]);
    } catch (e) {
      console.warn('Supabase create thread fallback:', e);
    }
  }

  return newThread;
}
