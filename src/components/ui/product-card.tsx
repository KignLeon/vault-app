"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { type NormalizedProduct } from "@/lib/products";
import { Plus } from "lucide-react";
import { GasclubLogo } from "./gasclub-logo";

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

  // Multi-image hover swap: show second image on hover if available
  const primaryImage = product.image;
  const hoverImage = product.images && product.images.length > 1 ? product.images[1] : null;
  const displayImage = (hovered && hoverImage) ? hoverImage : primaryImage;
  const hasImage = !!primaryImage && !imgError;

  return (
    <motion.div
      className="group cursor-pointer text-left outline-none w-full"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div
        className="relative aspect-square w-full overflow-hidden mb-2 border product-img-container"
        style={{ borderColor: border, background: isDark ? "#111" : "#f5f5f5" }}
        onClick={() => onClick?.(product)}
      >
        {hasImage ? (
          <>
            <img
              src={displayImage || primaryImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-300"
              style={{ opacity: 1 }}
            />
            {/* Subtle crossfade overlay on hover */}
            {hoverImage && (
              <img
                src={hovered ? primaryImage : hoverImage}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-500 pointer-events-none"
                style={{ opacity: 0 }}
                aria-hidden="true"
              />
            )}
            {/* Image count badge */}
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
            <span className="font-mono text-[8px] tracking-[0.2em]" style={{ color: muted, opacity: 0.6 }}>{product.name}</span>
          </div>
        )}

        {/* Top badges — use accentFg for guaranteed contrast */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {product.featured && (
            <span
              className="font-mono text-[7px] tracking-wider px-1.5 py-0.5 accent-badge"
              style={{ background: accent, color: accentFg }}
            >
              ⭐ TOP
            </span>
          )}
          {hasBulk && (
            <span
              className="font-mono text-[7px] tracking-wider px-1.5 py-0.5"
              style={{ background: surfaceAccent, color: fg, backdropFilter: "blur(4px)" }}
            >
              💼 BULK
            </span>
          )}
        </div>

        {/* Quick Add — always visible */}
        <button
          onClick={handleAdd}
          className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 transition-all"
          style={{ background: accent, color: accentFg }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Label */}
      <p className="font-mono text-[10px] tracking-[0.1em] font-bold truncate leading-tight" style={{ color: fg }} onClick={() => onClick?.(product)}>
        {product.name}
      </p>

      {/* Price + Bulk starting */}
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>${product.price}</span>
        {hasBulk && product.bulk && (
          <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
            · QP ${product.bulk[0].price}
          </span>
        )}
      </div>
    </motion.div>
  );
}
