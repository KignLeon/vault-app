"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { type Product } from "@/lib/data";
import { useProducts } from "@/hooks/use-products";
import { Ticket, Clock, Zap, Tag, ShoppingBag, Eye, Flame } from "lucide-react";
import { StockBadge } from "@/components/ui/stock-badge";
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
  { id: "d1", title: "PLATINUM LEMON CHERRY", description: "Member-exclusive pricing. 48hr window, limited units.", discount: "20% OFF", originalPrice: 120, dealPrice: 96, productId: "p1", expiresIn: "47h 23m", type: "flash", limited: true },
  { id: "d2", title: "PINK PANTHER — 6 LEFT", description: "Last units of this boutique drop. Grab before it's gone.", discount: "15% OFF", originalPrice: 110, dealPrice: 94, productId: "p2", expiresIn: "23h 45m", type: "flash", limited: true },
  { id: "d3", title: "UNCLE SNOOP — BULK", description: "QP / HP / LB pricing available. Wholesale tiers loaded.", discount: "BULK RATE", originalPrice: 115, dealPrice: 92, productId: "p3", expiresIn: "Ongoing", type: "bulk", limited: false },
  { id: "d4", title: "LEMON DIOR RUNTZ", description: "Exotic lemon-forward Runtz. Premium indoor batch.", discount: "18% OFF", originalPrice: 125, dealPrice: 103, productId: "p4", expiresIn: "35h 10m", type: "flash", limited: true },
  { id: "d5", title: "PROMO CODE: PROMO1", description: "25% off your first order. Any product, any quantity. One-time use per account.", discount: "25% OFF", originalPrice: 0, dealPrice: 0, expiresIn: "7 days", type: "member", limited: false },
  { id: "d6", title: "WARHEADZ — RESTOCKED", description: "Sour gas profile back in inventory. Heavy hitter.", discount: "10% OFF", originalPrice: 118, dealPrice: 106, productId: "p5", expiresIn: "Ongoing", type: "member", limited: false },
  { id: "d7", title: "WEDDING CAKE — INDOOR", description: "Premium indoor vanilla/earthy profile. Dense trichomes.", discount: "BULK RATE", originalPrice: 120, dealPrice: 96, productId: "p8", expiresIn: "Ongoing", type: "bulk", limited: false },
  { id: "d8", title: "ANY 2 STRAINS BUNDLE", description: "Mix and match any two products. Stack with PROMO1.", discount: "SAVE $20", originalPrice: 230, dealPrice: 210, expiresIn: "5 days", type: "member", limited: false },
];

const typeBg: Record<string, string> = { flash: "text-red-400", member: "text-green-400", bulk: "text-blue-400" };
const typeIcon = { flash: Zap, member: Ticket, bulk: Tag };

export default function DealsPage() {
  const { fg, border, isDark, cardBg, muted, accent, accentFg, accentGlow } = useTheme();
  const { addToCart, setCartOpen } = useCart();
  const { products } = useProducts();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const handleClaim = (deal: Deal) => {
    if (deal.productId) {
      const product = products.find((p) => p.id === deal.productId);
      if (product) { addToCart(product, 1); setCartOpen(true); }
    }
    setClaimed((prev) => new Set(prev).add(deal.id));
  };

  return (
    <AppShell>
      <div className="pt-6 pb-4 mb-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Ticket size={14} style={{ color: fg }} />
          <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: fg }}>EXCLUSIVE DEALS</h1>
        </div>
        <p className="text-sm" style={{ color: muted }}>Member-only pricing · Bulk tiers · Limited drops</p>
      </div>

      {/* Deal cards — product-card style grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {deals.map((deal, i) => {
          const Icon = typeIcon[deal.type];
          const isClaimed = claimed.has(deal.id);
          const product = deal.productId ? products.find((p) => p.id === deal.productId) : null;

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="group border overflow-hidden transition-colors"
              style={{ borderColor: border, background: cardBg }}
            >
              {/* Image — same aspect-square as product cards */}
              <div className="relative aspect-square w-full overflow-hidden" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                {product?.image ? (
                  <img src={product.image} alt={deal.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <GasclubLogo size={28} style={{ color: `${fg}22` }} accentColor={accent} />
                    <span className="font-mono text-[8px] tracking-[0.15em] text-center px-2" style={{ color: muted, opacity: 0.6 }}>{deal.title}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 font-bold" style={{ background: accent, color: accentFg }}>
                    {deal.discount}
                  </span>
                  <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 flex items-center gap-0.5" style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)", color: fg }}>
                    <Icon size={8} /> {deal.type.toUpperCase()}
                  </span>
                </div>

                {deal.limited && (
                  <span className="absolute top-1.5 right-1.5 font-mono text-[7px] tracking-wider px-1.5 py-0.5 text-red-400 font-bold" style={{ background: isDark ? "rgba(255,0,0,0.15)" : "rgba(255,0,0,0.08)" }}>
                    LIMITED
                  </span>
                )}

                {/* Quick add */}
                {deal.productId && !isClaimed && (
                  <button
                    onClick={() => handleClaim(deal)}
                    className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    style={{ background: fg, color: isDark ? "#000" : "#fff" }}
                  >
                    <ShoppingBag size={12} />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-mono text-[10px] tracking-[0.1em] font-bold truncate leading-tight" style={{ color: fg }}>{deal.title}</p>
                <p className="font-mono text-[8px] tracking-wider mt-1 line-clamp-2 leading-relaxed" style={{ color: muted }}>{deal.description}</p>

                {/* Pricing */}
                <div className="flex items-baseline gap-1.5 mt-2">
                  {deal.dealPrice > 0 && (
                    <>
                      <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>${deal.dealPrice}</span>
                      <span className="font-mono text-[9px] line-through" style={{ color: muted }}>${deal.originalPrice}</span>
                    </>
                  )}
                </div>

                {/* Timer */}
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={8} style={{ color: muted }} />
                  <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>{deal.expiresIn}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>{deals.length} DEALS AVAILABLE</span>
      </div>
    </AppShell>
  );
}
