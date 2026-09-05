import { Product, Order, ChatMessage, ChatThread, EscrowStatus } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Data access layer. Postgres (via Supabase) is the only source of truth.
 *
 * There is deliberately no in-memory fallback. The previous version kept mock
 * products, seeded orders, chats and messages in module state and served them
 * whenever a query failed OR returned zero rows. That made an empty table
 * indistinguishable from a populated one, showed un-editable phantom listings in
 * the admin console, and let writes report success while only reaching memory.
 * A database problem now surfaces as a database problem.
 */

/** Thrown when the database is unreachable or unconfigured. Routes map this to 503. */
export class DatabaseUnavailableError extends Error {
  readonly code = 'DATABASE_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new DatabaseUnavailableError(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLIC_KEY in .env.local.'
    );
  }
}

/**
 * supabase-js reports network failures through `error` rather than throwing, so
 * the presence of a Postgres/PostgREST error code is what separates "the server
 * rejected this" from "we never reached the server".
 */
function isConnectivityFailure(error: any): boolean {
  if (!error) return false;
  if (error.code) return false;
  return /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|socket/i.test(
    String(error.message || error)
  );
}

/** Normalises a supabase-js error into something a route can act on. */
function raise(error: any, action: string): never {
  if (isConnectivityFailure(error)) {
    throw new DatabaseUnavailableError(
      `Could not reach the database while trying to ${action}. Check that the Supabase project is running.`
    );
  }
  throw new Error(`Could not ${action}: ${error?.message || 'unknown database error'}`);
}

/* MAPPERS */

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
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    shippingAddress: row.shipping_address,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    totalAmount: Number(row.total_amount),
    // Default to 'pending', never 'paid'. An order whose status could not be
    // read must not present itself as funded.
    escrowStatus: row.escrow_status || 'pending',
    paystackReference: row.paystack_reference || undefined,
    createdAt: row.created_at,
  };
}

function mapDbChat(row: any): ChatThread {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    lastMessage: row.last_message,
    updatedAt: row.updated_at,
  };
}

function mapDbMessage(row: any): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    text: row.text,
    createdAt: row.created_at,
  };
}

/* PRODUCTS */

export async function getProducts(category?: string, query?: string): Promise<Product[]> {
  assertConfigured();

  let q = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (category && category !== 'All') q = q.eq('category', category);
  if (query) q = q.ilike('name', `%${query}%`);

  const { data, error } = await q;
  if (error) raise(error, 'load products');
  return (data || []).map(mapDbProduct);
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  assertConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) raise(error, 'load products');
  return (data || []).map(mapDbProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  assertConfigured();

  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) raise(error, 'load product');
  return data ? mapDbProduct(data) : null;
}

export async function addProduct(newProductData: Omit<Product, 'id'>): Promise<Product> {
  assertConfigured();

  const id = `ag-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data, error } = await supabase
    .from('products')
    .insert([{ id, ...toProductRow(newProductData as Partial<Product>) }])
    .select()
    .single();

  if (error) raise(error, 'create product');
  return mapDbProduct(data);
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
  assertConfigured();

  const row = toProductRow(patch);
  if (Object.keys(row).length === 0) return getProductById(id);

  const { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) raise(error, 'update product');
  return data ? mapDbProduct(data) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  assertConfigured();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) raise(error, 'delete product');
  return true;
}

/* ORDERS */

export async function getOrders(
  farmerId?: string,
  buyerEmail?: string,
  opts?: { adminListingsOnly?: boolean }
): Promise<Order[]> {
  assertConfigured();

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (buyerEmail) query = query.eq('buyer_email', buyerEmail);

  const { data, error } = await query;
  if (error) raise(error, 'load orders');

  let orders = (data || []).map(mapDbOrder);

  // items is JSONB, so these two filters cannot be pushed into the query.
  if (farmerId) {
    orders = orders.filter((o) => o.items.some((i) => i.farmerId === farmerId));
  }
  if (opts?.adminListingsOnly) {
    orders = orders.filter((o) => o.items.some((i) => i.listedByAdmin));
  }
  return orders;
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  assertConfigured();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('reference', reference)
    .maybeSingle();

  if (error) raise(error, 'load order');
  return data ? mapDbOrder(data) : null;
}

export async function getOrderByPaystackReference(reference: string): Promise<Order | null> {
  assertConfigured();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (error) raise(error, 'load order');
  return data ? mapDbOrder(data) : null;
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  assertConfigured();

  const id = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        id,
        reference: orderData.reference,
        buyer_name: orderData.buyerName,
        buyer_email: orderData.buyerEmail,
        buyer_phone: orderData.buyerPhone,
        shipping_address: orderData.shippingAddress,
        items: orderData.items,
        total_amount: orderData.totalAmount,
        escrow_status: orderData.escrowStatus,
        paystack_reference: orderData.paystackReference ?? null,
      },
    ])
    .select()
    .single();

  if (error) raise(error, 'create order');
  return mapDbOrder(data);
}

export async function updateOrderStatus(
  reference: string,
  escrowStatus: EscrowStatus
): Promise<Order | null> {
  assertConfigured();

  // Two explicit .eq() lookups rather than one .or() with the reference
  // interpolated into a PostgREST filter string - supabase-js has no parameter
  // binding for .or(), so a value containing a comma or parenthesis could
  // otherwise rewrite the predicate.
  let { data, error } = await supabase
    .from('orders')
    .update({ escrow_status: escrowStatus })
    .eq('reference', reference)
    .select()
    .maybeSingle();

  if (error) raise(error, 'update order');

  if (!data) {
    ({ data, error } = await supabase
      .from('orders')
      .update({ escrow_status: escrowStatus })
      .eq('paystack_reference', reference)
      .select()
      .maybeSingle());

    if (error) raise(error, 'update order');
  }

  return data ? mapDbOrder(data) : null;
}

/**
 * Idempotent status transition, for payment events that arrive more than once
 * and out of order (the verify call and the webhook routinely race).
 *
 * The `from` status is part of the WHERE clause, so the update is atomic: the
 * second caller matches zero rows instead of re-applying the transition. Zero
 * rows is therefore "already done" - a success, not a failure.
 */
export async function transitionOrderStatus(
  paystackReference: string,
  from: EscrowStatus,
  to: EscrowStatus
): Promise<{ order: Order | null; changed: boolean; alreadyApplied: boolean }> {
  assertConfigured();

  const { data, error } = await supabase
    .from('orders')
    .update({ escrow_status: to })
    .eq('paystack_reference', paystackReference)
    .eq('escrow_status', from)
    .select()
    .maybeSingle();

  if (error) raise(error, 'update order status');

  if (data) return { order: mapDbOrder(data), changed: true, alreadyApplied: false };

  const existing = await getOrderByPaystackReference(paystackReference);
  return {
    order: existing,
    changed: false,
    alreadyApplied: existing?.escrowStatus === to,
  };
}

/** Attaches the reference for a payment attempt. Overwritten on retry. */
export async function setOrderPaystackReference(
  orderReference: string,
  paystackReference: string
): Promise<boolean> {
  assertConfigured();

  const { data, error } = await supabase
    .from('orders')
    .update({ paystack_reference: paystackReference })
    .eq('reference', orderReference)
    .select()
    .maybeSingle();

  if (error) raise(error, 'attach payment reference');
  return Boolean(data);
}

/* CHATS */

// PostgREST filter strings have no parameter binding in supabase-js, so any
// value spliced into .or() must be shape-checked first.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function getChats(userId?: string): Promise<ChatThread[]> {
  assertConfigured();

  let query = supabase.from('chats').select('*').order('updated_at', { ascending: false });
  if (userId) {
    if (!SAFE_ID.test(userId)) return [];
    query = query.or(`buyer_id.eq.${userId},farmer_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) raise(error, 'load conversations');
  return (data || []).map(mapDbChat);
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  assertConfigured();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) raise(error, 'load messages');
  return (data || []).map(mapDbMessage);
}

export async function sendChatMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'farmer' | 'buyer' | 'admin',
  text: string
): Promise<ChatMessage> {
  assertConfigured();

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    chatId,
    senderId,
    senderName,
    senderRole,
    text,
    createdAt: new Date().toISOString(),
  };

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

  // supabase-js returns { error } rather than throwing, so this must be checked
  // explicitly - a foreign-key violation on chat_id used to be swallowed, and
  // the optimistic bubble simply vanished on the next reload.
  if (messageError) raise(messageError, 'send message');

  const { error: threadError } = await supabase
    .from('chats')
    .update({ last_message: text, updated_at: newMsg.createdAt })
    .eq('id', chatId);

  // Non-fatal: the message is stored, only the inbox preview is stale.
  if (threadError) {
    console.warn('Could not update chat thread preview:', threadError.message);
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
  assertConfigured();

  // `.limit(1)` matters because duplicate threads exist in data created before
  // this dedup check was added, and a bare .maybeSingle() throws on more than
  // one row.
  const { data: existingRows, error: lookupError } = await supabase
    .from('chats')
    .select('*')
    .eq('product_id', productId)
    .eq('buyer_id', buyerId)
    .eq('farmer_id', farmerId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (lookupError) raise(lookupError, 'open conversation');
  if (existingRows && existingRows.length > 0) return mapDbChat(existingRows[0]);

  const id = `chat-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data, error } = await supabase
    .from('chats')
    .insert([
      {
        id,
        product_id: productId,
        product_name: productName,
        buyer_id: buyerId,
        buyer_name: buyerName,
        farmer_id: farmerId,
        farmer_name: farmerName,
        last_message: 'Conversation started',
      },
    ])
    .select()
    .single();

  if (error) raise(error, 'open conversation');
  return mapDbChat(data);
}
