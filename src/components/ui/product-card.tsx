"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { type NormalizedProduct } from "@/lib/products";
import { Plus } from "lucide-react";
import { GasclubLogo } from "./gasclub-logo";

// Category dot colors — matches inventory page
const CAT_DOTS: Record<string, string> = {
  featured: "rgb(234,179,8)",
  exotic:   "rgb(168,85,247)",
  candy:    "rgb(236,72,153)",
  gas:      "rgb(34,197,94)",
  premium:  "rgb(59,130,246)",
  prerolls: "rgb(249,115,22)",
  smalls:   "rgb(156,163,175)",
};

export function ProductCard({
  product,
  onClick,
}: {
  product: NormalizedProduct;
  onClick?: (product: NormalizedProduct) => void;
}) {
  const { fg, border, isDark, muted, accent, accentFg, surfaceAccent } = useTheme();
  const { addToCart, setCartOpen } = useCart();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setCartOpen(true);
  };

  const hasBulk = product.bulk && product.bulk.length > 0;
  const primaryImage = product.image;
  const hoverImage = product.images && product.images.length > 1 ? product.images[1] : null;
  const displayImage = hovered && hoverImage ? hoverImage : primaryImage;
  const hasImage = !!primaryImage && !imgError;

  const isVideoUrl = (url: string) =>
    /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video/upload/");
  const primaryIsVideo = !!primaryImage && isVideoUrl(primaryImage);
  const displayIsVideo = !!displayImage && isVideoUrl(displayImage);

  const isSoldOut = product.status === "sold-out";
  const isLowStock = product.status === "low-stock";
  const catDot = CAT_DOTS[product.category] || muted;

  return (
    <motion.div
      className="group cursor-pointer text-left outline-none w-full"
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: isSoldOut ? 0.75 : 1 }}
    >
      {/* Image */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden border product-img-container"
        style={{ borderColor: border, background: isDark ? "#111" : "#f5f5f5" }}
        onClick={() => onClick?.(product)}
      >
        {hasImage ? (
          <>
            {displayIsVideo ? (
              <video
                src={displayImage || primaryImage}
                muted autoPlay loop playsInline preload="metadata"
                className="absolute inset-0 h-full w-full object-cover select-none"
              />
            ) : (
              <img
                src={displayImage || primaryImage}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-300"
              />
            )}
            {primaryIsVideo && !hovered && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="w-0 h-0 ml-1 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white" />
                </div>
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <div
                className="absolute bottom-1.5 left-1.5 font-mono text-[7px] tracking-wider px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
              >
                {product.images.length} PHOTOS
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <GasclubLogo size={28} style={{ color: `${fg}22` }} accentColor={accent} />
            <span className="font-mono text-[8px] tracking-[0.2em]" style={{ color: muted, opacity: 0.6 }}>
              {product.name}
            </span>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {product.featured && (
            <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5" style={{ background: accent, color: accentFg }}>
              ⭐ TOP
            </span>
          )}
          {hasBulk && (
            <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5" style={{ background: surfaceAccent, color: fg, backdropFilter: "blur(4px)" }}>
              💼 BULK
            </span>
          )}
        </div>

        {/* Top-right: stock status */}
        <div className="absolute top-1.5 right-1.5">
          {isSoldOut ? (
            <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5" style={{ background: "rgba(239,68,68,0.85)", color: "#fff" }}>
              SOLD OUT
            </span>
          ) : isLowStock ? (
            <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5" style={{ background: "rgba(234,179,8,0.85)", color: "#000" }}>
              LOW STOCK
            </span>
          ) : null}
        </div>

        {/* Quick Add button */}
        {!isSoldOut && (
          <button
            onClick={handleAdd}
            className="absolute bottom-2.5 right-2.5 w-11 h-11 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 transition-all"
            style={{ background: accent, color: accentFg }}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Label area */}
      <div className="px-2 pt-2 pb-3" onClick={() => onClick?.(product)}>
        {/* Category dot + label */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catDot }} />
          <span className="font-mono text-[8px] tracking-[0.12em] uppercase" style={{ color: muted }}>
            {product.category}
          </span>
        </div>

        {/* Product name */}
        <p className="font-mono text-[16px] md:text-[18px] tracking-[0.04em] font-bold leading-tight" style={{ color: isSoldOut ? muted : fg }}>
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span
            className="font-mono text-[18px] md:text-[20px] font-bold"
            style={{ color: isSoldOut ? muted : fg }}
          >
            ${product.price}
          </span>
          {hasBulk && product.bulk && (
            <span className="font-mono text-[11px] tracking-wider" style={{ color: muted }}>
              · bulk ${product.bulk[0].price}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
