"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { NormalizedProduct } from "@/lib/products";
import { shippingOptions } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  product: NormalizedProduct;
  qty: number;
}

export interface CompletedOrder {
  id: string;           // human-readable order number: GC-XXXXXXXX
  dbId?: string;        // Supabase UUID
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode?: string;
  shippingMethod: string;
  paymentMethod: string;
  createdAt: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: NormalizedProduct, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  // Promo
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  promoError: string;
  applyPromo: () => void;
  removePromo: () => void;
  discount: number;
  // Shipping
  shippingMethod: string;
  setShippingMethod: (id: string) => void;
  shippingCost: number;
  // Total
  total: number;
  // Orders
  orders: CompletedOrder[];
  placeOrder: (info: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes: string;
    paymentMethod: string;
  }) => Promise<CompletedOrder | null>;
  // Cart open state
  isCartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  isPlacingOrder: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

// ── PROMO CODES REMOVED FROM CLIENT ──────────────────────────────────────────
// Promo validation now goes through /api/promo/validate (server-side only)
// Codes and discount values are NEVER stored in the browser bundle

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // fraction e.g. 0.25
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>([]);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Load cart + orders from local session storage for this tab
  // (server persistence happens via orders table, cart is session-scoped for speed)
  useEffect(() => {
    try {
      const savedCart = sessionStorage.getItem("gc247_cart");
      if (savedCart) setItems(JSON.parse(savedCart));
      const savedPromos = localStorage.getItem("gc247_used_promos");
      if (savedPromos) setUsedPromoCodes(JSON.parse(savedPromos));
    } catch {}
  }, []);

  // Persist cart to sessionStorage on change
  useEffect(() => {
    try { sessionStorage.setItem("gc247_cart", JSON.stringify(items)); } catch {}
  }, [items]);

  const addToCart = useCallback((product: NormalizedProduct, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
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
    setAppliedDiscount(0);
    setPromoCode("");
    setPromoError("");
    try { sessionStorage.removeItem("gc247_cart"); } catch {}
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  // ── PROMO VALIDATION — Server-side only ────────────────────────────────────
  const applyPromo = useCallback(async () => {
    const code = promoCode.toUpperCase().trim();
    if (!code) return;

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.status === 429) {
        setPromoError("Too many attempts. Please wait a moment.");
        setTimeout(() => setPromoError(""), 5000);
        return;
      }

      const data = await res.json();

      if (!data.valid) {
        setPromoError(data.error || "INVALID PROMO CODE");
        setTimeout(() => setPromoError(""), 3000);
        return;
      }

      if (data.oneTime && usedPromoCodes.includes(code)) {
        setPromoError(`${code} has already been used.`);
        setTimeout(() => setPromoError(""), 4000);
        return;
      }

      setPromoApplied(true);
      setAppliedPromoCode(code);
      setAppliedDiscount(data.discount); // server-provided discount value
      setPromoError("");
    } catch {
      setPromoError("Could not validate promo code. Try again.");
      setTimeout(() => setPromoError(""), 3000);
    }
  }, [promoCode, usedPromoCodes]);

  const removePromo = useCallback(() => {
    setPromoApplied(false);
    setAppliedPromoCode("");
    setAppliedDiscount(0);
    setPromoCode("");
  }, []);

  const discount = promoApplied && appliedPromoCode
    ? subtotal * appliedDiscount
    : 0;


  const ship = shippingOptions.find((s) => s.id === shippingMethod);
  const shippingCost = items.length > 0 ? (ship?.price || 8) : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  // ── PLACE ORDER — DB-persisted ──────────────────────────────────────────────
  const placeOrder = useCallback(async (info: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes: string;
    paymentMethod: string;
  }): Promise<CompletedOrder | null> => {
    if (items.length === 0) return null;
    setIsPlacingOrder(true);

    try {
      // Get current session token for auth header
      const { data: { session } } = await supabase.auth.getSession();

      const payload = {
        items: items.map((i) => ({
          id: i.product.id,
          sku: i.product.sku,
          name: i.product.name,
          price: i.product.price,
          qty: i.qty,
          image: i.product.image,
        })),
        subtotal,
        discount,
        shippingCost,
        total,
        promoCode: promoApplied ? appliedPromoCode : null,
        shippingMethod,
        paymentMethod: info.paymentMethod,
        name: info.name,
        email: info.email,
        address: info.address,
        city: info.city,
        state: info.state,
        zip: info.zip,
        notes: info.notes,
        userId: session?.user?.id || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        console.error("[placeOrder] API error:", error);
        return null;
      }

      const { orderId, orderDbId } = await res.json();

      // Mark promo as used
      if (promoApplied && appliedPromoCode) {
        const newUsed = [...usedPromoCodes, appliedPromoCode];
        setUsedPromoCodes(newUsed);
        try { localStorage.setItem("gc247_used_promos", JSON.stringify(newUsed)); } catch {}
      }

      const completedOrder: CompletedOrder = {
        id: orderId,
        dbId: orderDbId,
        items: [...items],
        subtotal,
        discount,
        shipping: shippingCost,
        total,
        promoCode: promoApplied ? appliedPromoCode : undefined,
        shippingMethod,
        paymentMethod: info.paymentMethod,
        createdAt: new Date().toISOString(),
      };

      setOrders((prev) => [completedOrder, ...prev]);
      clearCart();
      return completedOrder;

    } finally {
      setIsPlacingOrder(false);
    }
  }, [items, subtotal, discount, shippingCost, total, promoApplied, appliedPromoCode, shippingMethod, usedPromoCodes, clearCart]);

  return (
    <CartContext.Provider
      value={{
        items, addToCart, removeFromCart, updateQty, clearCart,
        itemCount, subtotal,
        promoCode, setPromoCode, promoApplied, promoError, applyPromo, removePromo, discount,
        shippingMethod, setShippingMethod, shippingCost,
        total, orders, placeOrder,
        isCartOpen, setCartOpen,
        isPlacingOrder,
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
