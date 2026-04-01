"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { type Product, shippingOptions } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export interface CartItem {
  product: Product;
  qty: number;
}

export interface CompletedOrder {
  id: string; // The DB UUID
  display_id: string; // E.g., GC-XXX
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode?: string;
  shippingMethod: string;
  createdAt: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  promoError: string;
  applyPromo: () => void;
  removePromo: () => void;
  discount: number;
  shippingMethod: string;
  setShippingMethod: (id: string) => void;
  shippingCost: number;
  total: number;
  orders: CompletedOrder[];
  placeOrder: () => Promise<CompletedOrder | null>;
  isCartOpen: boolean;
  setCartOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const PROMO_CODES: Record<string, { discount: number; oneTime: boolean }> = {
  PROMO1: { discount: 0.25, oneTime: true },
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);

  // Sync Cart to DB or initial fetch
  useEffect(() => {
    if (user && !initialLoad) {
      // Attempt to load existing orders from DB
      supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) {
          setOrders(data.map(d => ({
            id: d.id,
            display_id: d.display_id,
            items: d.items,
            subtotal: d.subtotal,
            discount: d.discount,
            shipping: d.shipping,
            total: d.total,
            promoCode: "", // We could store promo codes on DB
            shippingMethod: d.shipping_method,
            createdAt: d.created_at
          })));
        }
      });
      setInitialLoad(true);
    }
  }, [user, initialLoad]);

  // DB-driven cart requires syncing `items` array to the `users` table if we want persistence across devices.
  // For now, MVP approach: keep it in React state until `placeOrder`. If user is logged in, placeOrder goes to DB!

  const addToCart = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoApplied(false);
    setAppliedPromoCode("");
    setPromoCode("");
    setPromoError("");
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  const applyPromo = useCallback(() => {
    const code = promoCode.toUpperCase().trim();
    const promo = PROMO_CODES[code];
    if (!promo) {
      setPromoError("INVALID PROMO CODE");
      setTimeout(() => setPromoError(""), 3000);
      return;
    }
    setPromoApplied(true);
    setAppliedPromoCode(code);
    setPromoError("");
  }, [promoCode]);

  const removePromo = useCallback(() => {
    setPromoApplied(false);
    setAppliedPromoCode("");
    setPromoCode("");
  }, []);

  const discount = promoApplied && appliedPromoCode ? subtotal * (PROMO_CODES[appliedPromoCode]?.discount || 0) : 0;
  const ship = shippingOptions.find((s) => s.id === shippingMethod);
  const shippingCost = items.length > 0 ? (ship?.price || 8) : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const placeOrder = useCallback(async (): Promise<CompletedOrder | null> => {
    if (items.length === 0) return null;

    const display_id = `GC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Proceed to DB Insert if User is Auth'd
    let orderId = `local_${Date.now()}`;
    if (user) {
      const { data, error } = await supabase.from('orders').insert({
        display_id,
        user_id: user.id,
        items,
        subtotal,
        discount,
        shipping: shippingCost,
        total,
        status: 'pending',
        shipping_method: shippingMethod
      }).select().single();

      if (!error && data) {
        orderId = data.id;
        
        // Trigger Webhook Notification Async securely
        fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: display_id, items, total, user_id: user.id })
        }).catch(e => console.error('Webhook trigger failed', e));
      }
    }

    const order: CompletedOrder = {
      id: orderId,
      display_id,
      items: [...items],
      subtotal,
      discount,
      shipping: shippingCost,
      total,
      promoCode: promoApplied ? appliedPromoCode : undefined,
      shippingMethod,
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [order, ...prev]);

    // Clear cart locally
    setItems([]);
    setPromoApplied(false);
    setAppliedPromoCode("");
    setPromoCode("");

    return order;
  }, [items, subtotal, discount, shippingCost, total, promoApplied, appliedPromoCode, shippingMethod, user]);

  return (
    <CartContext.Provider
      value={{
        items, addToCart, removeFromCart, updateQty, clearCart,
        itemCount, subtotal,
        promoCode, setPromoCode, promoApplied, promoError, applyPromo, removePromo, discount,
        shippingMethod, setShippingMethod, shippingCost,
        total, orders, placeOrder,
        isCartOpen, setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
