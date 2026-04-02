"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/ui/product-card";
import { categories } from "@/lib/data";
import type { BulkTier } from "@/lib/data";
import { fetchProducts, getLocalProducts, type NormalizedProduct } from "@/lib/products";
import { X, Minus, Plus, ShoppingBag, Eye, Flame, MessageCircle, Phone, MapPin, Zap } from "lucide-react";
import { GasclubLogo } from "@/components/ui/gasclub-logo";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedBulk, setSelectedBulk] = useState<BulkTier | null>(null);
  const [allProducts, setAllProducts] = useState<NormalizedProduct[]>(() => getLocalProducts());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { fg, border, isDark, muted, accent, accentFg, accentGlow, surfaceAccent, surfaceAccentFg } = useTheme();
  const { addToCart, setCartOpen } = useCart();

  // Background sync from Supabase (local data already rendered)
  useEffect(() => {
    fetchProducts().then((data) => {
      if (data.length > 0) setAllProducts(data);
    });
  }, []);

  const filtered = useMemo(() =>
    activeCategory === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCategory),
    [activeCategory, allProducts]
  );

  const openProduct = (product: NormalizedProduct) => {
    setSelectedProduct(product);
    setQty(1);
    setSelectedBulk(null);
    setGalleryIndex(0);
  };

  const currentPrice = selectedBulk ? selectedBulk.price : (selectedProduct?.price || 0) * qty;

  const handleAdd = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectedBulk ? 1 : qty);
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const buildOrderMsg = (method: string) => {
    if (!selectedProduct) return;
    const item = selectedBulk
      ? `${selectedProduct.name} (${selectedBulk.qty})`
      : `${selectedProduct.name} x${qty}`;
    const total = selectedBulk ? selectedBulk.price : selectedProduct.price * qty;
    const msg = encodeURIComponent(`Hey, I want to order:\n${item}\nTotal: $${total}\n\nName:\nLocation:\nPreferred delivery:`);
    if (method === "sms") window.open(`sms:?body=${msg}`);
    else if (method === "whatsapp") window.open(`https://wa.me/?text=${msg}`);
  };

  return (
    <AppShell>
      {/* Hero */}
      <div className="pt-6 pb-4" style={{ borderBottom: `1px solid ${border}` }}>
        <h1 className="font-mono text-xs tracking-[0.3em] uppercase mb-1" style={{ color: fg }}>
          INVENTORY
        </h1>
        <p className="text-sm" style={{ color: muted }}>
          Private inventory. Direct access. No middlemen.
        </p>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto no-scroll-bar -mx-4 px-4 md:mx-0 md:px-0 py-4 md:gap-3 md:flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="font-mono text-[10px] tracking-[0.15em] px-3 py-2 border transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5"
            style={{
              background: activeCategory === cat.id ? accent : "transparent",
              color: activeCategory === cat.id ? accentFg : muted,
              borderColor: activeCategory === cat.id ? accent : border,
            }}
          >
            {cat.emoji && <span className="text-xs">{cat.emoji}</span>}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product count */}
      <div className="mb-4">
        <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
          {loadingProducts ? "LOADING..." : `${filtered.length} PRODUCTS · BULK PRICING AVAILABLE`}
        </span>
      </div>

      {/* Grid — with loading skeletons */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded animate-pulse" style={{ background: isDark ? "#111" : "#f0f0f0" }} />
          ))}
        </div>
      ) : (
      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}

            >
              <ProductCard product={product} onClick={() => openProduct(product)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl md:rounded-none"
              style={{ background: isDark ? "#0a0a0a" : "#fff" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-2 md:hidden">
                <div className="w-8 h-1 rounded-full" style={{ background: border }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <span className="font-mono text-xs tracking-[0.2em] font-bold" style={{ color: fg }}>{selectedProduct.sku}</span>
                <button onClick={() => setSelectedProduct(null)} className="p-2 active:scale-90 transition-all" style={{ color: fg }}>
                  <X size={16} />
                </button>
              </div>

              {/* Gallery */}
              {(() => {
                const galleryImages = selectedProduct.images && selectedProduct.images.length > 0
                  ? selectedProduct.images
                  : selectedProduct.image ? [selectedProduct.image] : [];
                const hasGallery = galleryImages.length > 0;
                const currentImg = galleryImages[galleryIndex] || galleryImages[0];

                return (
                  <div className="relative">
                    <div className="aspect-square w-full overflow-hidden" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                      {hasGallery ? (
                        <img
                          src={currentImg}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <GasclubLogo size={48} style={{ color: border }} accentColor={accent} />
                          <span className="font-mono text-xs tracking-[0.2em]" style={{ color: muted }}>{selectedProduct.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Gallery navigation arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.max(0, galleryIndex - 1)); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-opacity"
                          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", opacity: galleryIndex === 0 ? 0.3 : 1 }}
                          disabled={galleryIndex === 0}
                        >
                          ‹
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.min(galleryImages.length - 1, galleryIndex + 1)); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-opacity"
                          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", opacity: galleryIndex === galleryImages.length - 1 ? 0.3 : 1 }}
                          disabled={galleryIndex === galleryImages.length - 1}
                        >
                          ›
                        </button>
                        {/* Image counter */}
                        <div
                          className="absolute bottom-2 right-2 font-mono text-[9px] tracking-wider px-2 py-0.5"
                          style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                        >
                          {galleryIndex + 1} / {galleryImages.length}
                        </div>
                      </>
                    )}

                    {/* Thumbnail strip */}
                    {galleryImages.length > 1 && (
                      <div className="flex gap-1 p-2 overflow-x-auto no-scroll-bar" style={{ background: isDark ? "#0a0a0a" : "#f0f0f0" }}>
                        {galleryImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGalleryIndex(idx)}
                            className="w-12 h-12 flex-shrink-0 overflow-hidden border-2 transition-all"
                            style={{
                              borderColor: idx === galleryIndex ? accent : "transparent",
                              opacity: idx === galleryIndex ? 1 : 0.5,
                            }}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Urgency bar */}
              <div className="flex items-center gap-4 px-5 py-2.5" style={{ background: isDark ? "#111" : "#f8f8f8", borderBottom: `1px solid ${border}` }}>
                {selectedProduct.viewers && (
                  <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    <Eye size={10} /> {selectedProduct.viewers} viewing
                  </span>
                )}
                {selectedProduct.recentOrders && (
                  <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    <Flame size={10} /> {selectedProduct.recentOrders} orders today
                  </span>
                )}

              </div>

              <div className="p-5 space-y-4">
                {/* Title + Price */}
                <div>
                  <h2 className="font-mono text-base tracking-wider font-bold uppercase" style={{ color: fg }}>{selectedProduct.name}</h2>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: muted }}>{selectedProduct.description}</p>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                  {selectedProduct.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[8px] tracking-wider px-2 py-0.5 border" style={{ borderColor: border, color: muted }}>
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>

                {/* Unit Price */}
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>UNIT</span>
                  <span className="font-mono text-xl font-bold" style={{ color: fg }}>${selectedProduct.price}</span>
                </div>

                {/* Bulk Pricing */}
                {selectedProduct.bulk && (
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.2em] mb-2 block" style={{ color: muted }}>💼 BULK PRICING</span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.bulk.map((tier) => (
                        <button
                          key={tier.label}
                          onClick={() => setSelectedBulk(selectedBulk?.label === tier.label ? null : tier)}
                          className="border p-3 text-center transition-all active:scale-95"
                          style={{
                            borderColor: selectedBulk?.label === tier.label ? accent : border,
                            background: selectedBulk?.label === tier.label ? surfaceAccent : "transparent",
                          }}
                        >
                          <span className="font-mono text-[10px] tracking-wider font-bold block" style={{ color: fg }}>{tier.qty}</span>
                          <span className="font-mono text-sm font-bold block mt-0.5" style={{ color: fg }}>${tier.price}</span>
                          <span className="font-mono text-[8px] tracking-wider block" style={{ color: muted }}>{tier.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity (only if no bulk selected) */}
                {!selectedBulk && (
                  <div className="flex items-center gap-4 py-3" style={{ borderTop: `1px solid ${border}` }}>
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>QTY</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center border active:scale-90 transition-transform" style={{ borderColor: border, color: fg }}><Minus size={12} /></button>
                      <span className="font-mono text-sm font-bold w-8 text-center" style={{ color: fg }}>{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center border active:scale-90 transition-transform" style={{ borderColor: border, color: fg }}><Plus size={12} /></button>
                    </div>
                    <span className="ml-auto font-mono text-sm font-bold" style={{ color: fg }}>${(selectedProduct.price * qty).toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Sticky Buy Bar */}
              <div className="sticky bottom-0 px-5 py-4 space-y-2" style={{ background: isDark ? "#0a0a0a" : "#fff", borderTop: `1px solid ${border}` }}>
                {/* Price summary */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                    {selectedBulk ? selectedBulk.qty : `${qty} UNIT${qty > 1 ? "S" : ""}`}
                  </span>
                  <span className="font-mono text-lg font-bold" style={{ color: fg }}>${currentPrice}</span>
                </div>

                {/* Primary actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-3 font-mono text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{ background: accent, color: accentFg }}
                  >
                    <ShoppingBag size={14} /> ADD TO CART
                  </button>
                  <button
                    onClick={() => { handleAdd(); setTimeout(() => window.location.href = "/checkout", 300); }}
                    className="flex-1 py-3 font-mono text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 border active:scale-[0.98] transition-transform disabled:opacity-40"
                    style={{ borderColor: accent, color: accent }}
                  >
                    <Zap size={14} /> BUY NOW
                  </button>
                </div>

                {/* Contact-based options */}
                <div className="flex gap-2">
                  <button
                    onClick={() => buildOrderMsg("sms")}
                    className="flex-1 py-2.5 font-mono text-[9px] tracking-[0.15em] flex items-center justify-center gap-1.5 border active:scale-95 transition-transform"
                    style={{ borderColor: border, color: muted }}
                  >
                    <MessageCircle size={11} /> ORDER VIA TEXT
                  </button>
                  <button
                    onClick={() => buildOrderMsg("whatsapp")}
                    className="flex-1 py-2.5 font-mono text-[9px] tracking-[0.15em] flex items-center justify-center gap-1.5 border active:scale-95 transition-transform"
                    style={{ borderColor: border, color: muted }}
                  >
                    <Phone size={11} /> WHATSAPP
                  </button>
                  <button
                    onClick={() => alert("Local meetup request submitted!")}
                    className="flex-1 py-2.5 font-mono text-[9px] tracking-[0.15em] flex items-center justify-center gap-1.5 border active:scale-95 transition-transform"
                    style={{ borderColor: border, color: muted }}
                  >
                    <MapPin size={11} /> MEETUP
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
