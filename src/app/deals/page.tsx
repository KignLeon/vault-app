"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { fetchProducts, type NormalizedProduct } from "@/lib/products";
import {
  Ticket, Clock, Tag, ShoppingBag, Flame, Crown, Package,
  Percent, RefreshCw, AlertCircle,
} from "lucide-react";
import { GasclubLogo } from "@/components/ui/gasclub-logo";

interface PromoCode {
  id: string;
  code: string;
  discount_pct: number;
  expires_at: string | null;
  min_order_amount: number | null;
  one_time: boolean;
  max_uses: number | null;
  use_count: number | null;
}

function getTimeLeft(expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export default function DealsPage() {
  const { fg, border, isDark, cardBg, muted, accent, accentFg } = useTheme();
  const { addToCart, setCartOpen } = useCart();

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Reload data from DB
  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      fetch("/api/promo", { cache: "no-store" }).then((r) => r.json()).then((d) => d.promos || []).catch(() => []),
      fetchProducts(),
    ]).then(([promoData, productData]) => {
      setPromos(promoData);
      setProducts(productData);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load deals. Please refresh.");
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Featured products for the "Hot Picks" section
  const hotPicks = products
    .filter((p) => p.status !== "sold-out" && !p.tags?.includes("hidden"))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="pt-6 pb-5 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ticket size={16} style={{ color: accent }} />
            <h1 className="font-mono text-sm tracking-[0.3em] uppercase font-bold" style={{ color: fg }}>
              DEALS & PROMOS
            </h1>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 border hover:opacity-70 transition-opacity"
            style={{ borderColor: border, color: muted }}
            title="Refresh deals"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <p className="font-mono text-[11px] leading-relaxed mt-1" style={{ color: muted }}>
          Active promo codes · Member pricing · Updated live from admin
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 border mb-6" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <span className="font-mono text-[10px] text-red-400">{error}</span>
        </div>
      )}

      {/* ═══ PROMO CODES SECTION ═══ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
            <Percent size={11} style={{ color: accent }} />
            <span className="font-mono text-[9px] tracking-[0.25em] font-bold" style={{ color: accent }}>PROMO CODES</span>
          </div>
          <div className="flex-1 h-px" style={{ background: border }} />
          {!loading && (
            <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
              {promos.length} ACTIVE
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border p-4 space-y-2 animate-pulse" style={{ borderColor: border }}>
                <div className="h-6 w-24 rounded" style={{ background: isDark ? "#1a1a1a" : "#f0f0f0" }} />
                <div className="h-3 w-full rounded" style={{ background: isDark ? "#1a1a1a" : "#f0f0f0" }} />
                <div className="h-3 w-2/3 rounded" style={{ background: isDark ? "#1a1a1a" : "#f0f0f0" }} />
              </div>
            ))}
          </div>
        ) : promos.length === 0 ? (
          <div className="border p-8 text-center" style={{ borderColor: border }}>
            <Tag size={24} style={{ color: muted, margin: "0 auto 8px" }} />
            <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
              NO ACTIVE PROMO CODES
            </p>
            <p className="font-mono text-[9px] mt-1" style={{ color: muted }}>
              Check back soon — deals are added regularly
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
              {promos.map((promo, i) => {
                const isCopied = copied === promo.code;
                const timeLeft = getTimeLeft(promo.expires_at);
                const isExpiringSoon = promo.expires_at
                  ? new Date(promo.expires_at).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 2
                  : false;

                return (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="border overflow-hidden"
                    style={{ borderColor: isCopied ? accent : border, background: cardBg, transition: "border-color 0.2s" }}
                  >
                    {/* Top — Discount Badge */}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}20` }}
                    >
                      <div className="flex items-center gap-2">
                        <Percent size={13} style={{ color: accent }} />
                        <span className="font-mono text-xl font-black" style={{ color: accent }}>
                          {promo.discount_pct}% OFF
                        </span>
                      </div>
                      {isExpiringSoon && (
                        <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 font-bold text-red-400 flex items-center gap-0.5 border border-red-400/30">
                          <Flame size={8} /> ENDING SOON
                        </span>
                      )}
                    </div>

                    {/* Code + Details */}
                    <div className="px-4 py-3 space-y-2.5">
                      {/* Clickable Code */}
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="w-full flex items-center justify-between px-3 py-2 border font-mono text-sm tracking-[0.25em] font-black transition-all hover:opacity-80 active:scale-[0.98]"
                        style={{
                          borderColor: isCopied ? accent : border,
                          color: isCopied ? accent : fg,
                          background: isCopied ? `${accent}10` : "transparent",
                        }}
                        title="Click to copy"
                      >
                        {promo.code}
                        <span className="font-mono text-[8px] tracking-wider ml-2" style={{ color: muted }}>
                          {isCopied ? "✓ COPIED" : "TAP TO COPY"}
                        </span>
                      </button>

                      {/* Info grid */}
                      <div className="space-y-1">
                        {promo.min_order_amount && (
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>MIN ORDER</span>
                            <span className="font-mono text-[9px] font-bold" style={{ color: fg }}>${promo.min_order_amount}</span>
                          </div>
                        )}
                        {promo.max_uses && (
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>USES LEFT</span>
                            <span className="font-mono text-[9px] font-bold" style={{ color: fg }}>
                              {Math.max(0, promo.max_uses - (promo.use_count || 0))} / {promo.max_uses}
                            </span>
                          </div>
                        )}
                        {promo.one_time && (
                          <div className="flex items-center gap-1.5">
                            <Crown size={9} style={{ color: accent }} />
                            <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>ONE-TIME USE PER ACCOUNT</span>
                          </div>
                        )}
                      </div>

                      {/* Timer */}
                      <div
                        className="flex items-center gap-1.5 pt-2"
                        style={{ borderTop: `1px solid ${border}` }}
                      >
                        <Clock size={9} style={{ color: isExpiringSoon ? "rgb(239,68,68)" : muted }} />
                        <span
                          className="font-mono text-[8px] tracking-wider"
                          style={{ color: isExpiringSoon ? "rgb(239,68,68)" : muted }}
                        >
                          {timeLeft}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ═══ HOT PICKS — Real products from inventory ═══ */}
      {hotPicks.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Flame size={11} className="text-red-400" />
              <span className="font-mono text-[9px] tracking-[0.25em] font-bold text-red-400">HOT PICKS</span>
            </div>
            <div className="flex-1 h-px" style={{ background: border }} />
            <span className="font-mono text-[8px] tracking-wider text-red-400 animate-pulse">● LIVE INVENTORY</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {hotPicks.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="group border overflow-hidden transition-all hover:shadow-lg"
                style={{ borderColor: border, background: cardBg }}
              >
                {/* Product Image */}
                <div
                  className="relative aspect-square w-full overflow-hidden"
                  style={{ background: isDark ? "#111" : "#f5f5f5" }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-3"
                      style={{ background: `linear-gradient(135deg, ${isDark ? "#111" : "#f5f5f5"}, ${isDark ? "#1a1a1a" : "#eee"})` }}
                    >
                      <GasclubLogo size={28} style={{ color: `${fg}22` }} accentColor={accent} />
                    </div>
                  )}
                  {product.featured && (
                    <span
                      className="absolute top-2 left-2 font-mono text-[7px] tracking-wider px-1.5 py-0.5 font-black"
                      style={{ background: accent, color: accentFg }}
                    >
                      FEATURED
                    </span>
                  )}
                  {product.stock <= 10 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 font-mono text-[7px] tracking-wider px-1.5 py-0.5 font-bold text-red-400 border border-red-400/30">
                      {product.stock} LEFT
                    </span>
                  )}
                  {/* Quick Add */}
                  <button
                    onClick={() => { addToCart(product, 1); setCartOpen(true); }}
                    className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    style={{ background: fg, color: isDark ? "#000" : "#fff" }}
                  >
                    <ShoppingBag size={13} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="font-mono text-[10px] tracking-[0.1em] font-bold truncate leading-tight" style={{ color: fg }}>
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] font-black" style={{ color: fg }}>${product.price}</span>
                    <span className="font-mono text-[8px] tracking-wider uppercase" style={{ color: muted }}>
                      {product.category}
                    </span>
                  </div>
                  {product.bulk && (
                    <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
                      💼 BULK PRICING AVAILABLE
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="mt-4 mb-8 text-center space-y-2">
        <span className="font-mono text-[10px] tracking-[0.2em] block" style={{ color: muted }}>
          {promos.length} PROMO CODE{promos.length !== 1 ? "S" : ""} ACTIVE
        </span>
        <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
          Deals update in real-time · Managed by admin · Subject to availability
        </p>
      </div>
    </AppShell>
  );
}
