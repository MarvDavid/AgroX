'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '@/types';

export type ToastVariant = 'success' | 'error';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
  toastMessage: string | null;
  toastVariant: ToastVariant;
  showToast: (msg: string, variant?: ToastVariant) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('success');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cart from localStorage on client side mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('agrox_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('agrox_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [cart]);

  // Variant defaults to 'success' so existing one-argument calls are unchanged.
  // The admin console needs to report failures, which previously only ever
  // reached console.error.
  const showToast = (msg: string, variant: ToastVariant = 'success') => {
    // Each call used to start its own timer, so a second toast inherited the
    // first one's countdown and could vanish almost immediately.
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVariant(variant);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
      toastTimer.current = null;
    }, variant === 'error' ? 5000 : 3000);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prevCart, { product, quantity }];
    });
    showToast(`Added "${product.name}" to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        totalPrice,
        toastMessage,
        toastVariant,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
