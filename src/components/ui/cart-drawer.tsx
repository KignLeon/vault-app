"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CartDrawer() {
  const {
    items, isCartOpen, setCartOpen, removeFromCart, updateQty,
    subtotal, promoCode, setPromoCode, promoApplied, promoError,
    applyPromo, removePromo, discount, shippingCost, total, itemCount,
  } = useCart();
  const { fg, border, isDark, muted, accent, accentFg } = useTheme();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
            onClick={() => setCartOpen(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring" as const, damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-[201] h-full w-full max-w-md flex flex-col"
            style={{ background: isDark ? "#080808" : "#fff" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14" style={{ borderBottom: `1px solid ${border}` }}>
              <span className="font-mono text-[10px] tracking-[0.25em] font-bold" style={{ color: fg }}>
                CART ({itemCount})
              </span>
              <button onClick={() => setCartOpen(false)} className="p-2 -mr-2 active:scale-90 transition-transform" style={{ color: fg }}>
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <ShoppingBag size={28} style={{ color: muted, opacity: 0.2 }} />
                  <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>YOUR CART IS EMPTY</p>
                  <button onClick={() => setCartOpen(false)} className="font-mono text-[9px] tracking-wider border-b pb-0.5 active:scale-95 transition-transform" style={{ color: fg, borderColor: border }}>
                    BROWSE INVENTORY
                  </button>
                </div>
              ) : (
                <div className="px-5">
                  {items.map((item, idx) => (
                    <div key={item.product.id} className="flex gap-4 py-4" style={{ borderBottom: idx < items.length - 1 ? `1px solid ${border}` : "none" }}>
                      {/* Product Image */}
                      <div className="w-[72px] h-[72px] flex-shrink-0 overflow-hidden" style={{ background: isDark ? "#111" : "#f3f3f3" }}>
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-mono text-[7px] tracking-wider text-center px-1" style={{ color: muted }}>{item.product.sku}</span>
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <p className="font-mono text-[10px] tracking-wider font-bold truncate" style={{ color: fg }}>{item.product.name}</p>
                          <p className="font-mono text-sm font-bold mt-1" style={{ color: fg }}>${(item.product.price * item.qty).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-0 mt-2">
                          <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center border-y border-l active:scale-90 transition-transform" style={{ borderColor: border, color: fg }}>
                            <Minus size={10} />
                          </button>
                          <span className="font-mono text-[10px] tracking-wider w-10 h-8 flex items-center justify-center border" style={{ borderColor: border, color: fg }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center border-y border-r active:scale-90 transition-transform" style={{ borderColor: border, color: fg }}>
                            <Plus size={10} />
                          </button>
                          <button onClick={() => removeFromCart(item.product.id)} className="ml-auto p-1.5 active:scale-90 transition-transform" style={{ color: muted }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 space-y-4" style={{ borderTop: `1px solid ${border}` }}>
                {/* Promo */}
                <div>
                  {!promoApplied ? (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag size={10} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
                        <input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="PROMO CODE"
                          className="w-full bg-transparent border pl-8 pr-3 py-2.5 font-mono text-[9px] tracking-[0.2em] outline-none transition-colors"
                          style={{ borderColor: border, color: fg }}
                        />
                      </div>
                      <button onClick={applyPromo} className="px-4 py-2.5 font-mono text-[9px] tracking-wider active:scale-95 transition-transform" style={{ background: accent, color: accentFg }}>
                        APPLY
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-1.5">
                        <Check size={10} style={{ color: "rgb(34,197,94)" }} />
                        <span className="font-mono text-[9px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>PROMO1 — 25% OFF</span>
                      </div>
                      <button onClick={removePromo} className="font-mono text-[8px] tracking-wider active:scale-95 transition-transform" style={{ color: muted }}>
                        REMOVE
                      </button>
                    </div>
                  )}
                  {promoError && <p className="font-mono text-[9px] tracking-wider text-red-400 mt-1">{promoError}</p>}
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    <span>SUBTOTAL</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>
                      <span>DISCOUNT</span><span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    <span>SHIPPING</span><span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm tracking-wider font-bold pt-2" style={{ color: fg, borderTop: `1px solid ${border}` }}>
                    <span>TOTAL</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 font-mono text-[10px] tracking-[0.2em] active:scale-[0.98] transition-transform"
                  style={{ background: accent, color: accentFg }}
                >
                  CHECKOUT <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
