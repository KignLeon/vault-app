"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useCart, type CompletedOrder } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { Send, Package, Clock, Check, Truck, CreditCard, ChevronRight, ShoppingBag, Search } from "lucide-react";
import Link from "next/link";

// ---- STATUS COLORS ----
const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-400/30",
  paid:       "bg-green-500/10  text-green-400  border-green-400/30",
  processing: "bg-blue-500/10   text-blue-400   border-blue-400/30",
  shipped:    "bg-purple-500/10 text-purple-400 border-purple-400/30",
  completed:  "bg-neutral-500/10 text-neutral-400 border-neutral-400/30",
  cancelled:  "bg-red-500/10    text-red-400     border-red-400/30",
};

// ---- ORDER STATUS TIMELINE ----
const STATUS_STEPS = [
  { key: "pending", label: "PLACED", icon: Package },
  { key: "paid", label: "PAID", icon: CreditCard },
  { key: "shipped", label: "SHIPPED", icon: Truck },
  { key: "completed", label: "DELIVERED", icon: Check },
];

function getStatusIndex(status: string): number {
  const map: Record<string, number> = { pending: 0, paid: 1, shipped: 2, completed: 3, delivered: 3 };
  return map[status] ?? 0;
}

function OrderStatusTimeline({ status, accent, muted, fg, isDark, border }: { status: string; accent: string; muted: string; fg: string; isDark: boolean; border: string }) {
  const currentIndex = getStatusIndex(status);

  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isCompleted ? accent : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"),
                  border: isCurrent ? `2px solid ${accent}` : "none",
                }}
              >
                <Icon size={10} style={{ color: isCompleted ? (isDark ? "#000" : "#fff") : muted }} />
              </div>
              <span className="font-mono text-[7px] tracking-wider" style={{ color: isCompleted ? fg : muted }}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ background: i < currentIndex ? accent : border }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- DB ORDER CARD ----
function DbOrderCard({ order, accent, accentGlow, accentFg, fg, border, muted, isDark, cardBg }: {
  order: any;
  accent: string;
  accentGlow: string;
  accentFg: string;
  fg: string;
  border: string;
  muted: string;
  isDark: boolean;
  cardBg: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.created_at);
  const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const items = Array.isArray(order.items) ? order.items : [];
  const statusLabel = (order.status || "pending").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border overflow-hidden"
      style={{ borderColor: border, background: cardBg }}
    >
      {/* Order Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: expanded ? `1px solid ${border}` : "none" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accentGlow }}>
            <Package size={16} style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-xs font-bold tracking-wider" style={{ color: fg }}>{order.order_number}</p>
              <span className={`font-mono text-[7px] tracking-wider px-2 py-0.5 border ${STATUS_COLORS[order.status] || ""}`}>
                {statusLabel}
              </span>
            </div>
            <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
              {formattedDate} · {formattedTime} · {items.length} item{items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm font-bold" style={{ color: fg }}>${Number(order.total).toFixed(2)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 active:scale-90 transition-transform"
            style={{ color: muted }}
          >
            <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
              <ChevronRight size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Status Timeline */}
              <OrderStatusTimeline status={order.status || "pending"} accent={accent} muted={muted} fg={fg} isDark={isDark} border={border} />

              {/* Items */}
              <div className="space-y-2">
                {(items as Array<{ name?: string; qty?: number; price?: number; image?: string; sku?: string }>).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-mono text-[6px]" style={{ color: muted }}>{item.sku || "?"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] tracking-wider font-bold truncate" style={{ color: fg }}>{item.name || item.sku || "?"}</p>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>QTY {item.qty || 1} · ${item.price || 0} each</p>
                    </div>
                    <p className="font-mono text-xs font-bold" style={{ color: fg }}>${((item.price || 0) * (item.qty || 1)).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  <span>SUBTOTAL</span><span>${Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>
                    <span>DISCOUNT</span><span>-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  <span>SHIPPING</span><span>${Number(order.shipping_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-xs tracking-wider font-bold pt-2" style={{ color: fg, borderTop: `1px solid ${border}` }}>
                  <span>TOTAL</span><span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Tracking */}
              {order.tracking_number && (
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${border}` }}>
                  <Truck size={12} style={{ color: accent }} />
                  <span className="font-mono text-[10px] tracking-wider" style={{ color: fg }}>
                    Tracking: {order.tracking_number}
                  </span>
                </div>
              )}

              {/* Actions */}
              {order.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/instructions?order=${order.order_number}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-wider active:scale-95 transition-transform"
                    style={{ background: accent, color: accentFg }}
                  >
                    <CreditCard size={10} /> PAY NOW
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- SESSION ORDER CARD (fallback for orders not yet in DB) ----
function SessionOrderCard({ order, accent, accentGlow, accentFg, fg, border, muted, isDark, cardBg }: {
  order: CompletedOrder;
  accent: string;
  accentGlow: string;
  accentFg: string;
  fg: string;
  border: string;
  muted: string;
  isDark: boolean;
  cardBg: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border overflow-hidden"
      style={{ borderColor: border, background: cardBg }}
    >
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: expanded ? `1px solid ${border}` : "none" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accentGlow }}>
            <Package size={16} style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs font-bold tracking-wider" style={{ color: fg }}>{order.id}</p>
              <span className="font-mono text-[7px] tracking-wider px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-400/30">
                PENDING
              </span>
            </div>
            <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
              {formattedDate} · {formattedTime} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm font-bold" style={{ color: fg }}>${order.total.toFixed(2)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 active:scale-90 transition-transform"
            style={{ color: muted }}
          >
            <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
              <ChevronRight size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-mono text-[6px]" style={{ color: muted }}>{item.product.sku}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] tracking-wider font-bold truncate" style={{ color: fg }}>{item.product.name}</p>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>QTY {item.qty} · ${item.product.price} each</p>
                    </div>
                    <p className="font-mono text-xs font-bold" style={{ color: fg }}>${(item.product.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  <span>SUBTOTAL</span><span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: "rgb(34,197,94)" }}>
                    <span>DISCOUNT</span><span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  <span>SHIPPING</span><span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-xs tracking-wider font-bold pt-2" style={{ color: fg, borderTop: `1px solid ${border}` }}>
                  <span>TOTAL</span><span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href={`/instructions?order=${order.id}`}
                className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-wider active:scale-95 transition-transform w-full"
                style={{ background: accent, color: accentFg }}
              >
                <CreditCard size={10} /> PAY NOW
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- MAIN ORDERS PAGE ----
function OrdersContent() {
  const { fg, border, muted, accent, accentFg, accentGlow, isDark, cardBg } = useTheme();
  const { orders: sessionOrders } = useCart();
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "request">("history");

  // ── Order Lookup State ──
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [foundOrder, setFoundOrder] = useState<any | null>(null);

  // Fetch persisted orders from Supabase
  useEffect(() => {
    async function fetchMyOrders() {
      try {
        const stored = localStorage.getItem("gc247_my_orders");
        const orderNumbers: string[] = stored ? JSON.parse(stored) : [];

        if (orderNumbers.length === 0) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/orders/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumbers }),
        });

        if (res.ok) {
          const data = await res.json();
          setDbOrders(data.orders || []);
        }
      } catch (err) {
        console.warn("[OrdersPage] Failed to fetch orders:", err);
      }
      setLoading(false);
    }

    fetchMyOrders();
  }, []);

  // ── Order Lookup Handler ──
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setLookupError("Please enter a valid order number.");
      setTimeout(() => setLookupError(""), 3000);
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    setFoundOrder(null);

    try {
      const res = await fetch("/api/orders/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.order) {
        setFoundOrder(data.order);
        setActiveTab("history");

        // Save to localStorage so it persists on this device
        try {
          const existing = JSON.parse(localStorage.getItem("gc247_my_orders") || "[]");
          if (!existing.includes(data.order.order_number)) {
            existing.unshift(data.order.order_number);
            localStorage.setItem("gc247_my_orders", JSON.stringify(existing.slice(0, 50)));
          }
          // Also add to dbOrders if not already present
          if (!dbOrders.find(o => o.order_number === data.order.order_number)) {
            setDbOrders(prev => [data.order, ...prev]);
          }
        } catch {}
      } else {
        setLookupError(data.error || "Order not found.");
        setTimeout(() => setLookupError(""), 5000);
      }
    } catch {
      setLookupError("Connection error. Please try again.");
      setTimeout(() => setLookupError(""), 4000);
    }

    setLookupLoading(false);
  };

  // Merge: show DB orders, plus any session orders not yet in DB
  const dbOrderNumbers = new Set(dbOrders.map(o => o.order_number));
  const uniqueSessionOrders = sessionOrders.filter(o => !dbOrderNumbers.has(o.id));
  const hasOrders = dbOrders.length > 0 || uniqueSessionOrders.length > 0 || foundOrder !== null;
  const totalCount = dbOrders.length + uniqueSessionOrders.length;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-6 pb-4 mb-4"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: fg }}>
          ORDERS
        </h1>
        <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: muted }}>
          Track your orders and submit new requests
        </p>
      </motion.div>

      {/* ── Find Your Order — Cross-Device Lookup ── */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div
          className="border p-4 space-y-3"
          style={{
            borderColor: foundOrder ? accent : border,
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
          }}
        >
          <div className="flex items-center gap-2">
            <Search size={12} style={{ color: accent }} />
            <span className="font-mono text-[9px] tracking-[0.2em] font-bold" style={{ color: fg }}>
              FIND YOUR ORDER
            </span>
          </div>
          <p className="font-mono text-[9px] tracking-wider leading-relaxed" style={{ color: muted }}>
            Enter your order number to track it from any device.
          </p>
          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value.toUpperCase())}
                placeholder="GC247-XXXXX"
                className="w-full bg-transparent border px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] outline-none transition-colors"
                style={{
                  borderColor: lookupError ? "rgb(239,68,68)" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"),
                  color: fg,
                }}
                disabled={lookupLoading}
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !lookupInput.trim()}
              className="px-5 py-2.5 font-mono text-[9px] tracking-[0.15em] font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: accent, color: accentFg }}
            >
              {lookupLoading ? "..." : "FIND"}
            </button>
          </form>

          {/* Lookup feedback */}
          <AnimatePresence>
            {lookupError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[9px] tracking-wider text-red-400"
              >
                {lookupError}
              </motion.p>
            )}
            {foundOrder && !lookupError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[9px] tracking-wider"
                style={{ color: "rgb(34,197,94)" }}
              >
                ✓ ORDER FOUND — {foundOrder.order_number} · ${Number(foundOrder.total).toFixed(2)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-0 mb-6 border" style={{ borderColor: border }}>
        <button
          onClick={() => setActiveTab("history")}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.15em] transition-all"
          style={{
            background: activeTab === "history" ? accent : "transparent",
            color: activeTab === "history" ? accentFg : muted,
          }}
        >
          <Clock size={12} /> ORDER HISTORY {totalCount > 0 && `(${totalCount})`}
        </button>
        <button
          onClick={() => setActiveTab("request")}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.15em] transition-all"
          style={{
            background: activeTab === "request" ? accent : "transparent",
            color: activeTab === "request" ? accentFg : muted,
          }}
        >
          <Send size={12} /> NEW REQUEST
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "history" ? (
          <motion.div key="history" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
                <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>LOADING ORDERS...</span>
              </div>
            ) : !hasOrders ? (
              <div className="flex flex-col items-center justify-center py-20 gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: accentGlow }}
                >
                  <ShoppingBag size={28} style={{ color: accent }} />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="font-mono text-xs tracking-[0.2em] font-bold" style={{ color: fg }}>NO ORDERS YET</p>
                  <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>Your order history will appear here</p>
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    Have an order number? Use the lookup above to find it.
                  </p>
                </div>
                <Link
                  href="/inventory"
                  className="font-mono text-[10px] tracking-[0.2em] px-8 py-3 active:scale-95 transition-transform"
                  style={{ background: accent, color: accentFg }}
                >
                  START SHOPPING
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                  {totalCount} ORDER{totalCount > 1 ? "S" : ""}
                </p>
                {/* DB-persisted orders first */}
                {dbOrders.map((order) => (
                  <DbOrderCard
                    key={order.id}
                    order={order}
                    accent={accent}
                    accentGlow={accentGlow}
                    accentFg={accentFg}
                    fg={fg}
                    border={border}
                    muted={muted}
                    isDark={isDark}
                    cardBg={cardBg}
                  />
                ))}
                {/* Session-only orders (just placed, not yet in DB response) */}
                {uniqueSessionOrders.map((order) => (
                  <SessionOrderCard
                    key={order.id}
                    order={order}
                    accent={accent}
                    accentGlow={accentGlow}
                    accentFg={accentFg}
                    fg={fg}
                    border={border}
                    muted={muted}
                    isDark={isDark}
                    cardBg={cardBg}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="request" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <NewOrderView />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

// ---- NEW ORDER VIEW ----
function NewOrderView() {
  const { fg, border, muted, accent, accentFg, accentGlow } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 gap-8 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: accentGlow }}>
        <ShoppingBag size={24} style={{ color: accent }} />
      </div>
      <div className="space-y-2">
        <h2 className="font-mono text-sm tracking-[0.2em] font-bold" style={{ color: fg }}>PLACE AN ORDER</h2>
        <p className="font-mono text-[11px] tracking-wider max-w-xs" style={{ color: muted }}>
          Browse the inventory, add items to your cart, then checkout securely.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/inventory"
          className="w-full py-3 font-mono text-[10px] tracking-[0.25em] text-center active:scale-95 transition-transform"
          style={{ background: accent, color: accentFg }}
        >
          BROWSE INVENTORY
        </Link>
        <Link href="/checkout"
          className="w-full py-3 font-mono text-[10px] tracking-[0.2em] text-center border active:scale-95 transition-transform"
          style={{ borderColor: border, color: muted }}
        >
          GO TO CHECKOUT
        </Link>
      </div>
    </motion.div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="pt-6 pb-4">
          <div className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: "rgb(120,120,120)" }}>
            LOADING...
          </div>
        </div>
      </AppShell>
    }>
      <OrdersContent />
    </Suspense>
  );
}
