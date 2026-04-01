"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useCart, CompletedOrder } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { shippingOptions } from "@/lib/data";
import { Check, ChevronLeft, Lock, Shield, CreditCard, Wallet, Building2, MessageCircle, Sparkles, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PaymentMethod = "crypto" | "zelle" | "wire" | "telegram";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; desc: string; next: string; icon: typeof Wallet }[] = [
  { id: "crypto", label: "CRYPTO", desc: "BTC · ETH · USDT", next: "Wallet address provided after order", icon: Wallet },
  { id: "zelle", label: "ZELLE", desc: "Instant bank transfer", next: "Transfer details sent via Telegram", icon: CreditCard },
  { id: "wire", label: "BANK WIRE", desc: "Direct transfer", next: "Routing info provided after order", icon: Building2 },
  { id: "telegram", label: "TELEGRAM", desc: "Coordinate payment directly", next: "Use your order number to finalize", icon: MessageCircle },
];

export default function CheckoutPage() {
  const { items, subtotal, discount, promoApplied, promoCode, setPromoCode, applyPromo, removePromo, promoError, shippingMethod, setShippingMethod, shippingCost, total, placeOrder } = useCart();
  const { fg, border, isDark, cardBg, muted, accent, accentFg, accentGlow, accentMuted } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [placedOrder, setPlacedOrder] = useState<CompletedOrder | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("crypto");

  const handlePlaceOrder = () => {
    setProcessing(true);
    setTimeout(async () => {
      const order = await placeOrder();
      setPlacedOrder(order);
      setProcessing(false);
    }, 1500);
  };

  // ---- EMPTY CART STATE ----
  if (items.length === 0 && !placedOrder) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: accentGlow }}
          >
            <Package size={28} style={{ color: accent }} />
          </motion.div>
          <div className="text-center space-y-2">
            <p className="font-mono text-xs tracking-[0.2em] font-bold" style={{ color: fg }}>YOUR CART IS EMPTY</p>
            <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>Browse our inventory to add items</p>
          </div>
          <Link href="/inventory" className="font-mono text-[10px] tracking-[0.2em] px-8 py-3 active:scale-95 transition-transform" style={{ background: accent, color: accentFg }}>
            SHOP NOW
          </Link>
        </div>
      </AppShell>
    );
  }

  // ---- ORDER CONFIRMATION ----
  if (placedOrder) {
    return (
      <AppShell>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 pt-12 pb-8 px-4">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 300, delay: 0.2 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: accent }}>
              <Check size={28} style={{ color: accentFg }} />
            </div>
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${accent}` }}
            />
          </motion.div>

          <div className="text-center space-y-2">
            <h1 className="font-mono text-sm tracking-[0.3em] font-bold" style={{ color: fg }}>ORDER CONFIRMED</h1>
            <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>Your order has been placed successfully</p>
          </div>

          {/* Order Number — Premium Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center border p-6 w-full max-w-sm"
            style={{ borderColor: accent, background: accentGlow }}
          >
            <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: muted }}>ORDER NUMBER</p>
            <p className="font-mono text-2xl font-bold tracking-wider mt-1" style={{ color: fg }}>{placedOrder.id}</p>
            <p className="font-mono text-[8px] tracking-wider mt-2" style={{ color: muted }}>Save this — you&apos;ll need it for payment</p>
          </motion.div>

          {/* Order Items */}
          <div className="w-full max-w-sm space-y-3" style={{ borderTop: `1px solid ${border}`, paddingTop: "1rem" }}>
            {placedOrder.items.map((i) => (
              <div key={i.product.id} className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: fg }}>
                <span>{i.product.name} × {i.qty}</span>
                <span>${(i.product.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-3 space-y-1" style={{ borderTop: `1px solid ${border}` }}>
              {placedOrder.discount > 0 && (
                <div className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>
                  <span>PROMO</span><span>-${placedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                <span>SHIPPING</span><span>${placedOrder.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono text-base tracking-wider font-bold pt-3" style={{ color: fg, borderTop: `1px solid ${border}` }}>
                <span>TOTAL</span><span>${placedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="w-full max-w-sm space-y-2">
            <Link href={`/instructions?order=${placedOrder.id}`} className="block w-full text-center font-mono text-[10px] tracking-[0.2em] py-3.5 active:scale-[0.98] transition-transform" style={{ background: accent, color: accentFg }}>
              PAYMENT INSTRUCTIONS →
            </Link>
            <Link href="/inventory" className="block w-full text-center font-mono text-[10px] tracking-[0.2em] py-3.5 border active:scale-[0.98] transition-transform" style={{ borderColor: border, color: fg }}>
              CONTINUE SHOPPING
            </Link>
          </div>
        </motion.div>
      </AppShell>
    );
  }

  const inputCls = "w-full bg-transparent border px-4 py-3.5 font-mono text-xs tracking-wider outline-none transition-colors placeholder:opacity-30";

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 pt-6 pb-5 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={() => router.back()} className="p-1 active:scale-90 transition-transform" style={{ color: fg }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: fg }}>CHECKOUT</h1>
            <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>{items.length} ITEM{items.length > 1 ? "S" : ""} · ${total.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Section 01 - Contact */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: accent, color: accentFg }}>1</span>
                <h2 className="font-mono text-[10px] tracking-[0.25em]" style={{ color: fg }}>CONTACT</h2>
              </div>
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="FULL NAME" className={inputCls} style={{ borderColor: border, color: fg }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="EMAIL" type="email" className={inputCls} style={{ borderColor: border, color: fg }} />
              </div>
            </section>

            {/* Section 02 - Shipping */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: accent, color: accentFg }}>2</span>
                <h2 className="font-mono text-[10px] tracking-[0.25em]" style={{ color: fg }}>SHIPPING</h2>
              </div>
              <div className="space-y-3">
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ADDRESS" className={inputCls} style={{ borderColor: border, color: fg }} />
                <div className="grid grid-cols-6 gap-3">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="CITY" className={`${inputCls} col-span-3`} style={{ borderColor: border, color: fg }} />
                  <input value={state} onChange={(e) => setState(e.target.value)} placeholder="ST" className={`${inputCls} col-span-1`} style={{ borderColor: border, color: fg }} />
                  <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className={`${inputCls} col-span-2`} style={{ borderColor: border, color: fg }} />
                </div>
              </div>

              {/* Shipping Method */}
              <div className="mt-4 space-y-2">
                {shippingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setShippingMethod(opt.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 border transition-all active:scale-[0.99]"
                    style={{
                      borderColor: shippingMethod === opt.id ? accent : border,
                      background: shippingMethod === opt.id ? accentGlow : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Truck size={14} style={{ color: shippingMethod === opt.id ? accent : muted }} />
                      <div>
                        <p className="font-mono text-[10px] tracking-wider font-bold" style={{ color: fg }}>{opt.label}</p>
                        <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>{opt.est}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold" style={{ color: fg }}>${opt.price}</span>
                      {shippingMethod === opt.id && <Check size={14} style={{ color: accent }} />}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 03 - Payment Method */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: accent, color: accentFg }}>3</span>
                <h2 className="font-mono text-[10px] tracking-[0.25em]" style={{ color: fg }}>PAYMENT METHOD</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = payMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPayMethod(method.id)}
                      className="flex flex-col items-start p-4 border transition-all active:scale-[0.98] text-left"
                      style={{
                        borderColor: isSelected ? accent : border,
                        background: isSelected ? accentGlow : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} style={{ color: isSelected ? accent : muted }} />
                        <p className="font-mono text-[10px] tracking-wider font-bold" style={{ color: fg }}>{method.label}</p>
                      </div>
                      <p className="font-mono text-[8px] tracking-wider mt-0.5" style={{ color: muted }}>{method.desc}</p>
                      {isSelected && <Check size={10} className="mt-1.5" style={{ color: accent }} />}
                    </button>
                  );
                })}
              </div>

              {/* Selected method info */}
              <div className="mt-3 px-4 py-3 flex items-start gap-2" style={{ background: accentGlow, borderLeft: `2px solid ${accent}` }}>
                <Shield size={12} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
                <p className="font-mono text-[9px] tracking-wider leading-relaxed" style={{ color: muted }}>
                  {PAYMENT_METHODS.find((m) => m.id === payMethod)?.next}
                </p>
              </div>
            </section>

            {/* Section 04 - Notes */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: muted }}>4</span>
                <h2 className="font-mono text-[10px] tracking-[0.25em]" style={{ color: muted }}>NOTES <span className="text-[8px]">(OPTIONAL)</span></h2>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions, delivery preferences..."
                rows={3}
                className={`${inputCls} resize-none`}
                style={{ borderColor: border, color: fg }}
              />
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="border p-6 sticky top-20 space-y-5" style={{ borderColor: border, background: cardBg }}>
              <h2 className="font-mono text-[10px] tracking-[0.25em] font-bold" style={{ color: fg }}>ORDER SUMMARY</h2>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-mono text-[7px] tracking-wider" style={{ color: muted }}>{item.product.sku}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] tracking-wider font-bold truncate" style={{ color: fg }}>{item.product.name}</p>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>QTY {item.qty} · ${item.product.price} each</p>
                    </div>
                    <p className="font-mono text-xs font-bold flex-shrink-0" style={{ color: fg }}>${(item.product.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Promo */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: "1rem" }}>
                {!promoApplied ? (
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="PROMO CODE"
                      className="flex-1 bg-transparent border px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] outline-none"
                      style={{ borderColor: border, color: fg }}
                    />
                    <button onClick={applyPromo} className="px-4 py-2.5 font-mono text-[9px] tracking-wider active:scale-95 transition-transform" style={{ background: accent, color: accentFg }}>
                      APPLY
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded" style={{ background: "rgba(34,197,94,0.08)" }}>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={10} style={{ color: "rgb(34,197,94)" }} />
                      <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: "rgb(34,197,94)" }}>PROMO1 APPLIED — 25% OFF</span>
                    </div>
                    <button onClick={removePromo} className="font-mono text-[9px] tracking-wider active:scale-95 transition-transform" style={{ color: muted }}>
                      REMOVE
                    </button>
                  </div>
                )}
                {promoError && <p className="font-mono text-[9px] tracking-wider text-red-400 mt-1">{promoError}</p>}
              </div>

              {/* Totals — Premium */}
              <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <div className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                  <span>SUBTOTAL</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>
                    <span>DISCOUNT</span><span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                  <span>SHIPPING</span><span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-base tracking-wider font-bold pt-3" style={{ color: fg, borderTop: `2px solid ${accent}` }}>
                  <span>TOTAL</span><span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                <Lock size={12} style={{ color: accent }} />
                <div>
                  <p className="font-mono text-[8px] tracking-wider font-bold" style={{ color: fg }}>SECURE CHECKOUT</p>
                  <p className="font-mono text-[7px] tracking-wider" style={{ color: muted }}>Encrypted · Private · Protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-14 left-0 right-0 z-[90] px-4 pb-3 pt-3 safe-area-bottom" style={{ background: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.98)", borderTop: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>{items.length} ITEM{items.length > 1 ? "S" : ""}</span>
            <span className="font-mono text-sm font-bold tracking-wider" style={{ color: fg }}>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={processing}
            className="w-full py-3.5 font-mono text-xs tracking-[0.2em] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden"
            style={{ background: accent, color: accentFg, boxShadow: `0 0 20px ${accentGlow}` }}
          >
            {processing ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                PROCESSING...
              </motion.span>
            ) : (
              "PLACE ORDER"
            )}
          </button>
        </div>
      </motion.div>
    </AppShell>
  );
}
