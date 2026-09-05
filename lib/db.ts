import { Product, Order, ChatMessage, ChatThread, EscrowStatus } from '@/types';
import { MOCK_PRODUCTS } from './data';
import { supabase, isSupabaseConfigured } from './supabase';

// Memory fallback state, used when Supabase is unreachable or unconfigured.
//
// Pinned to globalThis rather than held in module scope. Checkout now spans three
// requests (create order -> initialize payment -> verify), so a plain module-level
// array is reset by any HMR recompile mid-checkout in dev, which surfaces as a
// baffling "order not found". This keeps a single instance alive across reloads.
//
// Note this is still per-process: memory mode is a single-instance demo path, not
// something to deploy behind a load balancer.
const memory = globalThis as any;

const inMemoryProducts: Product[] = (memory.__agrox_products ??= [...MOCK_PRODUCTS]);

/**
 * Whether the last Supabase call failed while Supabase was *configured*.
 *
 * Writes still fall back to memory so the app stays usable during an outage, but
 * falling back silently would tell an admin their listing was saved when it only
 * exists until the next restart. Routes read this to attach an honest warning.
 */
let degradedReason: string | null = memory.__agrox_degraded ?? null;

function markDegraded(reason: string) {
  degradedReason = reason;
  memory.__agrox_degraded = reason;
}

function markHealthy() {
  degradedReason = null;
  memory.__agrox_degraded = null;
}

/**
 * Distinguishes "the database rejected this write" from "we never reached it".
 *
 * supabase-js does NOT throw on a network failure - it returns it in `error`
 * just like a constraint violation - so the presence of a Postgres/PostgREST
 * error code is the reliable signal. A real data error (e.g. 23503, a
 * foreign-key violation) must surface to the caller; a connectivity failure
 * should degrade to the in-memory fallback instead of breaking the app.
 */
function isConnectivityError(error: any): boolean {
  if (!error) return false;
  if (error.code) return false; // A Postgres/PostgREST code means the server answered.
  return /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket/i.test(
    String(error.message || error)
  );
}

export function getDbHealth(): { degraded: boolean; reason: string | null; usingMemory: boolean } {
  return {
    degraded: Boolean(degradedReason),
    reason: degradedReason,
    usingMemory: !isSupabaseConfigured || Boolean(degradedReason),
  };
}

const inMemoryOrders: Order[] = (memory.__agrox_orders ??= [
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
]);

const inMemoryChats: ChatThread[] = (memory.__agrox_chats ??= [
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
]);

const inMemoryMessages: ChatMessage[] = (memory.__agrox_messages ??= [
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
]);

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
    listedByAdmin: Boolean(row.listed_by_admin),
  };
}

/** camelCase Product fields -> snake_case products columns. */
function toProductRow(product: Partial<Product>): Record<string, any> {
  const row: Record<string, any> = {};
  if (product.name !== undefined) row.name = product.name;
  if (product.category !== undefined) row.category = product.category;
  if (product.price !== undefined) row.price = product.price;
  if (product.originalPrice !== undefined) row.original_price = product.originalPrice;
  if (product.unit !== undefined) row.unit = product.unit;
  if (product.rating !== undefined) row.rating = product.rating;
  if (product.reviewsCount !== undefined) row.reviews_count = product.reviewsCount;
  if (product.image !== undefined) row.image = product.image;
  if (product.description !== undefined) row.description = product.description;
  if (product.seller !== undefined) row.seller = product.seller;
  if (product.inStock !== undefined) row.in_stock = product.inStock;
  if (product.stockCount !== undefined) row.stock_count = product.stockCount;
  if (product.isOrganic !== undefined) row.is_organic = product.isOrganic;
  if (product.featured !== undefined) row.featured = product.featured;
  if (product.tags !== undefined) row.tags = product.tags;
  if (product.listedByAdmin !== undefined) row.listed_by_admin = product.listedByAdmin;
  return row;
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
    // Default to 'pending', never 'paid'. An order whose status we could not read
    // must not present itself as funded.
    escrowStatus: row.escrow_status || row.escrowStatus || 'pending',
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
      // "Query succeeded and matched nothing" is a real, authoritative empty
      // result - only a *failed* query falls back to the mock catalogue. The old
      // `data.length > 0` check meant an empty products table silently served 12
      // phantom listings that no admin edit or delete could ever touch.
      if (!error && data) {
        return data.map(mapDbProduct);
      }
      if (error) {
        console.warn('Supabase fetch products failed, falling back to memory:', error.message);
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
    // Date.now() alone collides when two listings are created in the same
    // millisecond; the random suffix makes that practically impossible.
    id: `ag-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ id: newProduct.id, ...toProductRow(newProduct) }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (data) {
        markHealthy();
        return mapDbProduct(data);
      }
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  inMemoryProducts.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product | null> {
  const row = toProductRow(patch);
  if (Object.keys(row).length === 0) return getProductById(id);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(row)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data) {
        markHealthy();
        return mapDbProduct(data);
      }
      // Row genuinely absent from the database - fall through to memory, where a
      // listing created during an outage will be living.
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  inMemoryProducts[index] = { ...inMemoryProducts[index], ...patch, id };
  return inMemoryProducts[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  let deletedFromDb = false;

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      markHealthy();
      deletedFromDb = true;
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index !== -1) inMemoryProducts.splice(index, 1);

  return deletedFromDb || index !== -1;
}

/** Admin listing view: everything, including out-of-stock rows the storefront hides. */
export async function getAllProductsForAdmin(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      if (data) {
        markHealthy();
        return data.map(mapDbProduct);
      }
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }
  return [...inMemoryProducts];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDbProduct(data);
      }
    } catch (e) {
      console.warn('Supabase fetch product by id fallback:', e);
    }
  }

  const memoryMatch = inMemoryProducts.find((p) => p.id === id);
  return memoryMatch || null;
}

/* ORDERS CRUD */
export async function getOrders(
  farmerId?: string,
  buyerEmail?: string,
  opts?: { adminListingsOnly?: boolean }
): Promise<Order[]> {
  const applyFilters = (list: Order[]) => {
    let res = list;
    if (farmerId) {
      res = res.filter((o) => o.items.some((i) => i.farmerId === farmerId));
    }
    if (buyerEmail) {
      res = res.filter((o) => o.buyerEmail === buyerEmail);
    }
    // Orders snapshot their items as JSONB, so there is no join back to
    // products. `listedByAdmin` is stamped onto the item at order time, which is
    // what keeps an admin listing visible here even when it was attributed to a
    // real farmer via the composer's seller override.
    if (opts?.adminListingsOnly) {
      res = res.filter((o) => o.items.some((i) => i.listedByAdmin));
    }
    return res;
  };

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (buyerEmail) {
        query = query.eq('buyer_email', buyerEmail);
      }

      const { data, error } = await query;
      if (!error && data) {
        return applyFilters(data.map(mapDbOrder));
      }
    } catch (e) {
      console.warn('Supabase fetch orders fallback:', e);
    }
  }

  return applyFilters([...inMemoryOrders]);
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();
      if (!error && data) return mapDbOrder(data);
      if (!error) return null;
    } catch (e) {
      console.warn('Supabase get order by reference fallback:', e);
    }
  }
  return inMemoryOrders.find((o) => o.reference === reference) || null;
}

export async function getOrderByPaystackReference(reference: string): Promise<Order | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_reference', reference)
        .maybeSingle();
      if (!error && data) return mapDbOrder(data);
      if (!error) return null;
    } catch (e) {
      console.warn('Supabase get order by paystack reference fallback:', e);
    }
  }
  return inMemoryOrders.find((o) => o.paystackReference === reference) || null;
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

export async function updateOrderStatus(
  reference: string,
  escrowStatus: EscrowStatus
): Promise<Order | null> {
  if (isSupabaseConfigured) {
    try {
      // Was a single .or(`reference.eq.${reference},...`) with the value
      // interpolated straight into a PostgREST filter string - a reference
      // containing a comma or parenthesis could rewrite the predicate.
      // supabase-js has no parameter binding for .or(), so two .eq() lookups is
      // the actual fix rather than an escaping trick.
      let { data, error } = await supabase
        .from('orders')
        .update({ escrow_status: escrowStatus })
        .eq('reference', reference)
        .select()
        .maybeSingle();

      if (!error && !data) {
        ({ data, error } = await supabase
          .from('orders')
          .update({ escrow_status: escrowStatus })
          .eq('paystack_reference', reference)
          .select()
          .maybeSingle());
      }

      if (error) throw new Error(error.message);
      if (data) {
        markHealthy();
        return mapDbOrder(data);
      }
      // No such row in the database - fall through to memory, where an order
      // created during an outage will be living.
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  // Memory mode only. Previously this mutated memory *before* the DB write and
  // returned the mutated object, so a failed write left the two silently
  // disagreeing and the caller was told it succeeded.
  const target = inMemoryOrders.find(
    (o) => o.reference === reference || o.paystackReference === reference
  );
  if (!target) return null;
  target.escrowStatus = escrowStatus;
  return target;
}

/**
 * Idempotent status transition, for payment events that can arrive more than
 * once and out of order (the verify call and the webhook routinely race).
 *
 * The `from` status is part of the WHERE clause, so the update is atomic: the
 * second caller matches zero rows instead of re-applying the transition. Zero
 * rows is therefore "already done" - a success, not a failure - which is what
 * `alreadyApplied` reports.
 */
export async function transitionOrderStatus(
  paystackReference: string,
  from: EscrowStatus,
  to: EscrowStatus
): Promise<{ order: Order | null; changed: boolean; alreadyApplied: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ escrow_status: to })
        .eq('paystack_reference', paystackReference)
        .eq('escrow_status', from)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (data) return { order: mapDbOrder(data), changed: true, alreadyApplied: false };

      const existing = await getOrderByPaystackReference(paystackReference);
      if (existing) {
        return { order: existing, changed: false, alreadyApplied: existing.escrowStatus === to };
      }
      // Not in the database at all - fall through to memory, where an order
      // created during a Supabase outage will be living.
    } catch (e) {
      console.warn('Supabase transition order failed, using memory:', e);
    }
  }

  const target = inMemoryOrders.find((o) => o.paystackReference === paystackReference);
  if (!target) return { order: null, changed: false, alreadyApplied: false };
  if (target.escrowStatus === to) return { order: target, changed: false, alreadyApplied: true };
  if (target.escrowStatus !== from) return { order: target, changed: false, alreadyApplied: false };
  target.escrowStatus = to;
  return { order: target, changed: true, alreadyApplied: false };
}

/**
 * Attach the reference for a payment attempt. Overwritten on retry.
 *
 * Falls through to memory when Supabase is configured but unreachable, matching
 * createOrder. Without that, an order created in memory during an outage could
 * never be paid for: the reference write would vanish and the subsequent verify
 * would report ORDER_NOT_FOUND.
 */
export async function setOrderPaystackReference(
  orderReference: string,
  paystackReference: string
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ paystack_reference: paystackReference })
        .eq('reference', orderReference)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data) return true;
    } catch (e) {
      console.warn('Supabase set paystack reference failed, using memory:', e);
    }
  }

  const target = inMemoryOrders.find((o) => o.reference === orderReference);
  if (!target) return false;
  target.paystackReference = paystackReference;
  return true;
}

/* CHATS CRUD */

// PostgREST filter strings have no parameter binding in supabase-js, so any value
// spliced into .or() must be shape-checked first. Chat ids in this app are all
// slug-like ('buyer-001', 's-101', 's-admin').
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function getChats(userId?: string): Promise<ChatThread[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('chats').select('*').order('updated_at', { ascending: false });
      if (userId) {
        if (!SAFE_ID.test(userId)) return [];
        query = query.or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapDbChat);
      }
    } catch (e) {
      console.warn('Supabase get chats fallback:', e);
    }
  }

  if (userId) {
    return inMemoryChats.filter((c) => c.buyerId === userId || c.farmerId === userId);
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

      // An empty thread is a real result. The old `data.length > 0` check meant a
      // brand-new conversation rendered the three seeded demo messages that
      // belong to chat-1 - someone else's conversation about maize pricing.
      if (!error && data) {
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
  senderRole: 'farmer' | 'buyer' | 'admin',
  text: string
): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    chatId,
    senderId,
    senderName,
    senderRole,
    text,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      // Two distinct failure kinds, handled differently:
      //  - a returned { error } means Postgres answered and REJECTED the write
      //    (e.g. a foreign-key violation on chat_id). That is a real data error
      //    and must surface; it used to be swallowed, so the optimistic bubble
      //    rendered and then vanished on reload.
      //  - a thrown exception means we never reached the server. That is an
      //    outage, and falling back to memory keeps the app usable.
      const { error: messageError } = await supabase.from('messages').insert([
        {
          id: newMsg.id,
          chat_id: chatId,
          sender_id: senderId,
          sender_name: senderName,
          sender_role: senderRole,
          text,
        },
      ]);

      if (messageError) {
        if (!isConnectivityError(messageError)) {
          throw Object.assign(new Error(`Could not send message: ${messageError.message}`), {
            isDataError: true,
          });
        }
        throw new Error(messageError.message);
      }

      const { error: threadError } = await supabase
        .from('chats')
        .update({ last_message: text, updated_at: newMsg.createdAt })
        .eq('id', chatId);

      // Non-fatal: the message is stored, only the inbox preview is stale.
      if (threadError) {
        console.warn('Could not update chat thread preview:', threadError.message);
      }

      markHealthy();
      return newMsg;
    } catch (e: any) {
      if (e?.isDataError) throw e;
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  inMemoryMessages.push(newMsg);
  const thread = inMemoryChats.find((c) => c.id === chatId);
  if (thread) {
    thread.lastMessage = text;
    thread.updatedAt = newMsg.createdAt;
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
  const build = (): ChatThread => ({
    id: `chat-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    productId,
    productName,
    buyerId,
    buyerName,
    farmerId,
    farmerName,
    lastMessage: 'Conversation started',
    updatedAt: new Date().toISOString(),
  });

  if (isSupabaseConfigured) {
    try {
      // The dedup check used to consult only the in-memory array, so a fresh
      // thread was minted on every server restart. `.limit(1)` matters because
      // duplicates already exist in live data from that bug, and a bare
      // .maybeSingle() throws when it finds more than one row.
      const { data: existingRows, error: lookupError } = await supabase
        .from('chats')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', buyerId)
        .eq('farmer_id', farmerId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (lookupError) throw new Error(lookupError.message);


      if (existingRows && existingRows.length > 0) {
        markHealthy();
        return mapDbChat(existingRows[0]);
      }

      const created = build();
      const { data, error } = await supabase
        .from('chats')
        .insert([
          {
            id: created.id,
            product_id: productId,
            product_name: productName,
            buyer_id: buyerId,
            buyer_name: buyerName,
            farmer_id: farmerId,
            farmer_name: farmerName,
            last_message: created.lastMessage,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);
      markHealthy();
      return mapDbChat(data);
    } catch (e: any) {
      markDegraded(e?.message || 'Database unreachable');
    }
  }

  const existing = inMemoryChats.find(
    (c) => c.productId === productId && c.buyerId === buyerId && c.farmerId === farmerId
  );
  if (existing) return existing;

  const newThread = build();
  inMemoryChats.unshift(newThread);
  return newThread;
}
