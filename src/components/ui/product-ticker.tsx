"use client";

import { useState, useEffect } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { useTheme } from "@/lib/theme";
import { fetchProducts, type NormalizedProduct } from "@/lib/products";
import { Flame, Sparkles, Tag, Zap } from "lucide-react";

// Badge configs
const BADGE_MAP: Record<string, { icon: typeof Flame; label: string }> = {
  featured: { icon: Sparkles, label: "TOP" },
  exotic: { icon: Flame, label: "EXOTIC" },
  prerolls: { icon: Zap, label: "PRE-ROLL" },
  smalls: { icon: Tag, label: "VALUE" },
  premium: { icon: Sparkles, label: "PREMIUM" },
};

function buildTickerProducts(products: NormalizedProduct[]): NormalizedProduct[] {
  // Only consider in-stock, visible products
  const visible = products.filter(
    (p) => p.status !== "sold-out" && !p.tags?.includes("hidden")
  );

  const items = [
    ...visible.filter((p) => p.featured).slice(0, 8),
    ...visible.filter((p) => p.category === "prerolls").slice(0, 3),
    ...visible.filter((p) => p.category === "smalls").slice(0, 2),
    ...visible.filter((p) => p.category === "exotic" && !p.featured).slice(0, 3),
  ];

  // Deduplicate
  const deduped = items.filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  // Fallback: if pool is too small, fill with any visible products
  if (deduped.length < 4) {
    const extra = visible
      .filter((p) => !deduped.find((x) => x.id === p.id))
      .slice(0, 16);
    return [...deduped, ...extra];
  }

  return deduped;
}

export function ProductTicker() {
  const {
    fg,
    border,
    isDark,
    muted,
    accent,
    accentFg,
    cardBg,
  } = useTheme();

  const [tickerProducts, setTickerProducts] = useState<NormalizedProduct[]>([]);

  // Fetch from Supabase — the single source of truth
  useEffect(() => {
    fetchProducts().then((data) => {
      setTickerProducts(buildTickerProducts(data));
    });
  }, []);

  // Don't render the ticker if there are no products yet
  if (tickerProducts.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden py-2.5 transition-colors duration-300"
      style={{
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)",
        borderBottom: `1px solid ${border}`,
        maskImage:
          "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <InfiniteSlider
        gap={16}
        reverse={false}
        speed={40}
        speedOnHover={12}
      >
        {tickerProducts.map((product) => {
          const badge = product.featured
            ? BADGE_MAP.featured
            : BADGE_MAP[product.category];
          const BadgeIcon = badge?.icon;

          return (
            <div
              key={product.id}
              className="flex items-center gap-2.5 px-3 py-1.5 border rounded-sm select-none shrink-0 transition-colors duration-300 group"
              style={{
                borderColor: border,
                background: cardBg,
              }}
            >
              {/* Product Image */}
              <div
                className="w-9 h-9 rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: isDark ? "#1a1a1a" : "#f0f0f0",
                }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="font-mono text-[7px] tracking-wider text-center leading-tight px-0.5"
                    style={{ color: muted }}
                  >
                    {product.name.split(" ").slice(0, 2).join("\n")}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col min-w-0">
                <span
                  className="font-mono text-[9px] tracking-[0.1em] font-bold truncate max-w-[100px] leading-tight"
                  style={{ color: fg }}
                >
                  {product.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: fg }}
                  >
                    ${product.price}
                  </span>
                  {badge && BadgeIcon && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1 py-px font-mono text-[6px] tracking-wider font-bold rounded-sm"
                      style={{
                        background: accent,
                        color: accentFg,
                      }}
                    >
                      <BadgeIcon size={7} />
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </InfiniteSlider>
    </div>
  );
}
