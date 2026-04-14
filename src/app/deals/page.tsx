"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { fetchProducts, type NormalizedProduct } from "@/lib/products";
import { Ticket, Clock, Zap, Tag, ShoppingBag, Flame, Crown, Package } from "lucide-react";
import { GasclubLogo } from "@/components/ui/gasclub-logo";

interface Deal {
  id: string;
  title: string;
  description: string;
  discount: string;
  originalPrice: number;
  dealPrice: number;
  productId?: string;
  expiresIn: string;
  type: "flash" | "member" | "bulk";
  limited: boolean;
}

const deals: Deal[] = [
  { id: "d1", title: "PLATINUM LEMON CHERRY", description: "Member-exclusive pricing. 48hr window, limited units.", discount: "20% OFF", originalPrice: 120, dealPrice: 96, productId: "TC-PLC-01", expiresIn: "47h 23m", type: "flash", limited: true },
  { id: "d2", title: "PINK PANTHER — 6 LEFT", description: "Last units of this boutique drop. Grab before it's gone.", discount: "15% OFF", originalPrice: 110, dealPrice: 94, productId: "TC-PP-01", expiresIn: "23h 45m", type: "flash", limited: true },
  { id: "d3", title: "UNCLE SNOOP — BULK", description: "QP / HP / LB pricing available. Wholesale tiers loaded.", discount: "BULK RATE", originalPrice: 115, dealPrice: 92, productId: "TC-US-01", expiresIn: "Ongoing", type: "bulk", limited: false },
  { id: "d4", title: "LEMON DIOR RUNTZ", description: "Exotic lemon-forward Runtz. Premium indoor batch.", discount: "18% OFF", originalPrice: 125, dealPrice: 103, productId: "TC-LDR-01", expiresIn: "35h 10m", type: "flash", limited: true },
  { id: "d5", title: "PROMO CODE: PROMO1", description: "25% off your first order. Any product, any quantity. One-time use per account.", discount: "25% OFF", originalPrice: 0, dealPrice: 0, expiresIn: "7 days", type: "member", limited: false },
  { id: "d6", title: "WARHEADZ — RESTOCKED", description: "Sour gas profile back in inventory. Heavy hitter.", discount: "10% OFF", originalPrice: 118, dealPrice: 106, productId: "TC-WH-01", expiresIn: "Ongoing", type: "member", limited: false },
  { id: "d7", title: "WEDDING CAKE — INDOOR", description: "Premium indoor vanilla/earthy profile. Dense trichomes.", discount: "BULK RATE", originalPrice: 120, dealPrice: 96, productId: "TC-WC-01", expiresIn: "Ongoing", type: "bulk", limited: false },
  { id: "d8", title: "ANY 2 STRAINS BUNDLE", description: "Mix and match any two products. Stack with PROMO1.", discount: "SAVE $20", originalPrice: 230, dealPrice: 210, expiresIn: "5 days", type: "member", limited: false },
];

const flashDeals = deals.filter(d => d.type === "flash");
const memberDeals = deals.filter(d => d.type === "member");
const bulkDeals = deals.filter(d => d.type === "bulk");

export default function DealsPage() {
  const { fg, border, isDark, cardBg, muted, accent, accentFg } = useTheme();
  const { addToCart, setCartOpen } = useCart();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [allProducts, setAllProducts] = useState<NormalizedProduct[]>([]);

  useEffect(() => {
    fetchProducts().then(setAllProducts);
  }, []);

  const handleClaim = (deal: Deal) => {
    if (deal.productId) {
      const product = allProducts.find((p) => p.sku === deal.productId);
      if (product) { addToCart(product, 1); setCartOpen(true); }
    }
    setClaimed((prev) => new Set(prev).add(deal.id));
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="pt-6 pb-5 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2.5 mb-2">
          <Ticket size={16} style={{ color: accent }} />
          <h1 className="font-mono text-sm tracking-[0.3em] uppercase font-bold" style={{ color: fg }}>EXCLUSIVE DEALS</h1>
        </div>
        <p className="font-mono text-[11px] leading-relaxed" style={{ color: muted }}>
          Member-only pricing · Bulk tiers · Limited drops · Updated regularly
        </p>
      </div>

      {/* ═══ FLASH DEALS SECTION ═══ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Zap size={11} className="text-red-400" />
            <span className="font-mono text-[9px] tracking-[0.25em] font-bold text-red-400">FLASH DEALS</span>
          </div>
          <div className="flex-1 h-px" style={{ background: border }} />
          <span className="font-mono text-[8px] tracking-wider text-red-400 animate-pulse">● LIVE</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {flashDeals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              allProducts={allProducts}
              claimed={claimed}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </section>

      {/* ═══ MEMBER EXCLUSIVE SECTION ═══ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
            <Crown size={11} style={{ color: accent }} />
            <span className="font-mono text-[9px] tracking-[0.25em] font-bold" style={{ color: accent }}>MEMBER EXCLUSIVE</span>
          </div>
          <div className="flex-1 h-px" style={{ background: border }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {memberDeals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              allProducts={allProducts}
              claimed={claimed}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </section>

      {/* ═══ BULK PRICING SECTION ═══ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Package size={11} className="text-blue-400" />
            <span className="font-mono text-[9px] tracking-[0.25em] font-bold text-blue-400">BULK PRICING</span>
          </div>
          <div className="flex-1 h-px" style={{ background: border }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {bulkDeals.map((deal, i) => (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              allProducts={allProducts}
              claimed={claimed}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="mt-4 mb-8 text-center space-y-2">
        <span className="font-mono text-[10px] tracking-[0.2em] block" style={{ color: muted }}>
          {deals.length} DEALS AVAILABLE
        </span>
        <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
          Deals update regularly · Prices subject to availability
        </p>
      </div>
    </AppShell>
  );
}

// ── Deal Card Component ──────────────────────────────────────────────────────
function DealCard({
  deal, index, allProducts, claimed, onClaim,
}: {
  deal: Deal;
  index: number;
  allProducts: NormalizedProduct[];
  claimed: Set<string>;
  onClaim: (deal: Deal) => void;
}) {
  const { fg, border, isDark, cardBg, muted, accent, accentFg } = useTheme();
  const isClaimed = claimed.has(deal.id);
  const product = deal.productId ? allProducts.find((p: NormalizedProduct) => p.sku === deal.productId) : null;

  const typeStyles: Record<string, { bg: string; text: string; icon: typeof Zap }> = {
    flash: { bg: "rgba(239,68,68,0.12)", text: "text-red-400", icon: Zap },
    member: { bg: `${accent}12`, text: "", icon: Ticket },
    bulk: { bg: "rgba(59,130,246,0.12)", text: "text-blue-400", icon: Tag },
  };
  const style = typeStyles[deal.type] || typeStyles.member;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group border overflow-hidden transition-all hover:shadow-lg"
      style={{ borderColor: border, background: cardBg }}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
        {product?.image ? (
          <img src={product.image} alt={deal.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: `linear-gradient(135deg, ${isDark ? '#111' : '#f5f5f5'}, ${isDark ? '#1a1a1a' : '#eee'})` }}>
            <GasclubLogo size={32} style={{ color: `${fg}22` }} accentColor={accent} />
            <span className="font-mono text-[8px] tracking-[0.15em] text-center px-3 leading-relaxed" style={{ color: muted, opacity: 0.7 }}>{deal.title}</span>
          </div>
        )}

        {/* Discount Badge — prominent */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2">
          <span
            className="font-mono text-[8px] tracking-wider px-2 py-1 font-black"
            style={{ background: accent, color: accentFg }}
          >
            {deal.discount}
          </span>
          {deal.limited && (
            <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 font-bold text-red-400 flex items-center gap-0.5" style={{ background: isDark ? "rgba(255,0,0,0.2)" : "rgba(255,0,0,0.1)" }}>
              <Flame size={8} /> LIMITED
            </span>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute bottom-2 left-2">
          <span className={`font-mono text-[7px] tracking-wider px-1.5 py-0.5 flex items-center gap-0.5 ${style.text}`} style={{ background: style.bg }}>
            <Icon size={8} /> {deal.type.toUpperCase()}
          </span>
        </div>

        {/* Quick add */}
        {deal.productId && !isClaimed && (
          <button
            onClick={() => onClaim(deal)}
            className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            style={{ background: fg, color: isDark ? "#000" : "#fff" }}
          >
            <ShoppingBag size={13} />
          </button>
        )}

        {/* Shimmer effect for flash deals */}
        {deal.type === "flash" && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
              animation: "shimmer 3s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="font-mono text-[10px] tracking-[0.1em] font-bold truncate leading-tight" style={{ color: fg }}>
          {deal.title}
        </p>
        <p className="font-mono text-[8px] tracking-wider line-clamp-2 leading-relaxed" style={{ color: muted }}>
          {deal.description}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          {deal.dealPrice > 0 && (
            <>
              <span className="font-mono text-[13px] font-black" style={{ color: fg }}>${deal.dealPrice}</span>
              <span className="font-mono text-[10px] line-through" style={{ color: muted }}>${deal.originalPrice}</span>
              <span className="font-mono text-[8px] font-bold text-green-400 ml-auto">
                SAVE ${deal.originalPrice - deal.dealPrice}
              </span>
            </>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: `1px solid ${border}` }}>
          <Clock size={9} style={{ color: deal.type === "flash" ? "rgb(239,68,68)" : muted }} />
          <span className="font-mono text-[8px] tracking-wider" style={{ color: deal.type === "flash" ? "rgb(239,68,68)" : muted }}>
            {deal.expiresIn}
          </span>
        </div>
      </div>

      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
}
