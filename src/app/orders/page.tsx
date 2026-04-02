"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useCart, type CompletedOrder } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Send, Package, ChevronDown, Clock, Check, Truck, CreditCard, Eye, ChevronRight, ShoppingBag, RotateCw, RefreshCw } from "lucide-react";
import Link from "next/link";

// ---- ORDER STATUS TIMELINE ----
const STATUS_STEPS = [
  { key: "placed", label: "PLACED", icon: Package },
  { key: "paid", label: "PAID", icon: CreditCard },
  { key: "shipped", label: "SHIPPED", icon: Truck },
  { key: "delivered", label: "DELIVERED", icon: Check },
];

function getStatusIndex(order: CompletedOrder): number {
  // All orders start as placed; for demo purposes show as placed
  return 0;
}

function OrderStatusTimeline({ order, accent, muted, fg, isDark, border }: { order: CompletedOrder; accent: string; muted: string; fg: string; isDark: boolean; border: string }) {
  const currentIndex = getStatusIndex(order);

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

// ---- ORDER CARD ----
function OrderCard({ order, accent, accentGlow, accentFg, fg, border, muted, isDark, cardBg }: {
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
      {/* Order Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: expanded ? `1px solid ${border}` : "none" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accentGlow }}>
            <Package size={16} style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs font-bold tracking-wider" style={{ color: fg }}>{order.id}</p>
              <span className="font-mono text-[7px] tracking-wider px-2 py-0.5" style={{ background: accent, color: accentFg }}>
                PLACED
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
              <OrderStatusTimeline order={order} accent={accent} muted={muted} fg={fg} isDark={isDark} border={border} />

              {/* Items */}
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

              {/* Breakdown */}
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

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/instructions?order=${order.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-wider active:scale-95 transition-transform"
                  style={{ background: accent, color: accentFg }}
                >
                  <CreditCard size={10} /> PAY NOW
                </Link>
                <button
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 border font-mono text-[9px] tracking-wider active:scale-95 transition-transform"
                  style={{ borderColor: border, color: muted }}
                >
                  <RotateCw size={10} /> REORDER
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- ORDER HISTORY VIEW ----
function OrderHistoryView() {
  const { orders } = useCart();
  const { fg, border, muted, isDark, cardBg, accent, accentGlow, accentFg } = useTheme();

  if (orders.length === 0) {
    return (
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
        </div>
        <Link
          href="/inventory"
          className="font-mono text-[10px] tracking-[0.2em] px-8 py-3 active:scale-95 transition-transform"
          style={{ background: accent, color: accentFg }}
        >
          START SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
        {orders.length} ORDER{orders.length > 1 ? "S" : ""}
      </p>
      {orders.map((order) => (
        <OrderCard
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
  );
}

// ---- NEW ORDER VIEW — directs to inventory + checkout ----
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
          className="w-full py-3. font-mono text-[10px] tracking-[0.25em] text-center active:scale-95 transition-transform py-3"
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

// ---- MAIN ORDERS PAGE ----
function OrdersContent() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { orders } = useCart();
  const [activeTab, setActiveTab] = useState<"history" | "request">(orders.length > 0 ? "history" : "request");

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-6 pb-4 mb-6"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: fg }}>
          ORDERS
        </h1>
        <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: muted }}>
          Track your orders and submit new requests
        </p>
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
          <Clock size={12} /> ORDER HISTORY {orders.length > 0 && `(${orders.length})`}
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
            <OrderHistoryView />
          </motion.div>
        ) : (
          <motion.div key="request" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <Suspense fallback={<div className="font-mono text-xs" style={{ color: muted }}>Loading...</div>}>
              <NewOrderView />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
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
