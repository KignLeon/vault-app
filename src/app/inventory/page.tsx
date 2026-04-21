"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/components/ui/product-card";
import type { BulkTier } from "@/lib/data";
import { fetchProducts, type NormalizedProduct } from "@/lib/products";
import { X, Minus, Plus, ShoppingBag, Eye, Flame, Zap, Package } from "lucide-react";
import { GasclubLogo } from "@/components/ui/gasclub-logo";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";

// ── Color palette for dynamic category dots ───────────────────────────────────
// Cycles through a set of vibrant colors — works for any category name
const DOT_PALETTE = [
  "rgb(234,179,8)",
  "rgb(168,85,247)",
  "rgb(236,72,153)",
  "rgb(34,197,94)",
  "rgb(59,130,246)",
  "rgb(249,115,22)",
  "rgb(156,163,175)",
  "rgb(239,68,68)",
  "rgb(20,184,166)",
  "rgb(250,204,21)",
];

function getCatDot(cats: string[], catId: string): string {
  const idx = cats.indexOf(catId);
  return DOT_PALETTE[idx % DOT_PALETTE.length] ?? DOT_PALETTE[0];
}

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedBulk, setSelectedBulk] = useState<BulkTier | null>(null);
  const [allProducts, setAllProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // ── Live categories from DB (derived from /api/categories) ──────────────────
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  const { fg, border, isDark, muted, accent, accentFg, surfaceAccent } = useTheme();
  const { addToCart, setCartOpen } = useCart();

  useEffect(() => {
    setLoading(true);
    // Load products and categories in parallel
    Promise.all([
      fetchProducts(),
      fetch("/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
    ]).then(([products, catData]) => {
      setAllProducts(products);
      setLoading(false);
      // Set categories from API; fall back to deriving from products if API returns nothing
      if (catData.categories?.length > 0) {
        setDbCategories(catData.categories);
      }
    });
  }, []);

  const visible = useMemo(
    () => allProducts.filter((p) => !p.tags?.includes("hidden")),
    [allProducts]
  );

  // ── Derive category list: API result OR distinct from products ──────────────
  const categoryList = useMemo(() => {
    if (dbCategories.length > 0) return dbCategories;
    // Fallback: extract distinct categories from actual products
    return [...new Set(visible.map((p) => p.category).filter(Boolean))].sort();
  }, [dbCategories, visible]);

  const filtered = useMemo(
    () => activeCategory === "all" ? visible : visible.filter((p) => p.category === activeCategory),
    [activeCategory, visible]
  );

  // ── Grouped sections for "all" view — uses real category list from DB ───────
  const grouped = useMemo(() =>
    categoryList
      .map((catId) => ({
        catId,
        dot: getCatDot(categoryList, catId),
        products: visible.filter((p) => p.category === catId),
      }))
      .filter((g) => g.products.length > 0),
    [categoryList, visible]
  );

  const openProduct = (p: NormalizedProduct) => {
    setSelectedProduct(p); setQty(1); setSelectedBulk(null); setGalleryIndex(0);
  };

  const handleAdd = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectedBulk ? 1 : qty);
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const currentPrice = selectedBulk
    ? selectedBulk.price
    : (selectedProduct?.price || 0) * qty;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="pt-8 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
        <h1 className="font-mono text-xl tracking-[0.2em] uppercase mb-1" style={{ color: fg }}>
          INVENTORY
        </h1>
        <p className="font-mono text-[11px] tracking-wider" style={{ color: muted }}>
          Private inventory · Direct access · No middlemen
        </p>
      </div>

      {/* ── Sticky Category Tabs — built from real DB categories ── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto no-scroll-bar py-3"
        style={{
          background: isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        {/* ALL tab */}
        <button
          onClick={() => setActiveCategory("all")}
          className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] px-3 py-1.5 border transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
          style={{
            background: activeCategory === "all" ? accent : "transparent",
            color: activeCategory === "all" ? accentFg : muted,
            borderColor: activeCategory === "all" ? accent : border,
          }}
        >
          ALL
          <span
            className="font-mono text-[9px] px-1 py-px rounded-sm"
            style={{
              background: activeCategory === "all"
                ? "rgba(0,0,0,0.2)"
                : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              color: activeCategory === "all" ? accentFg : muted,
            }}
          >
            {visible.length}
          </span>
        </button>

        {/* Dynamic category tabs */}
        {categoryList.map((catId) => {
          const count = visible.filter((p) => p.category === catId).length;
          if (count === 0) return null;
          const isActive = activeCategory === catId;
          const dot = getCatDot(categoryList, catId);
          return (
            <button
              key={catId}
              onClick={() => setActiveCategory(catId)}
              className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] px-3 py-1.5 border transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
              style={{
                background: isActive ? accent : "transparent",
                color: isActive ? accentFg : muted,
                borderColor: isActive ? accent : border,
              }}
            >
              {!isActive && (
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
              )}
              {catId.toUpperCase().replace(/-/g, " ")}
              <span
                className="font-mono text-[9px] px-1 py-px rounded-sm"
                style={{
                  background: isActive
                    ? "rgba(0,0,0,0.2)"
                    : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  color: isActive ? accentFg : muted,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse"
              style={{ background: isDark ? "#111" : "#f0f0f0" }}
            />
          ))}
        </div>
      ) : activeCategory === "all" ? (
        /* ── GROUPED SECTIONS VIEW — one section per real DB category ── */
        <div className="space-y-12 pt-6 pb-10">
          {grouped.map((group, gi) => (
            <motion.section
              key={group.catId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: gi * 0.04 }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: group.dot }}
                />
                <span
                  className="font-mono text-xs tracking-[0.3em] font-bold"
                  style={{ color: fg }}
                >
                  {group.catId.toUpperCase().replace(/-/g, " ")}
                </span>
                <div className="flex-1 h-px" style={{ background: border }} />
                <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  {group.products.length} ITEM{group.products.length !== 1 ? "S" : ""}
                </span>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-px">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => openProduct(product)}
                  />
                ))}
              </div>
            </motion.section>
          ))}

          {/* Products with no category / uncategorized */}
          {(() => {
            const uncategorized = visible.filter(
              (p) => !p.category || !categoryList.includes(p.category)
            );
            if (uncategorized.length === 0) return null;
            return (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: muted }} />
                  <span className="font-mono text-xs tracking-[0.3em] font-bold" style={{ color: fg }}>
                    OTHER
                  </span>
                  <div className="flex-1 h-px" style={{ background: border }} />
                  <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    {uncategorized.length} ITEMS
                  </span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-px">
                  {uncategorized.map((product) => (
                    <ProductCard key={product.id} product={product} onClick={() => openProduct(product)} />
                  ))}
                </div>
              </motion.section>
            );
          })()}

          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Package size={32} style={{ color: muted }} />
              <p className="font-mono text-[11px] tracking-[0.25em]" style={{ color: muted }}>
                NO PRODUCTS AVAILABLE
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── FILTERED CATEGORY VIEW ── */
        <div className="pt-4 pb-10">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: getCatDot(categoryList, activeCategory) }}
            />
            <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
              {filtered.length} {filtered.length === 1 ? "PRODUCT" : "PRODUCTS"} ·{" "}
              {activeCategory.toUpperCase().replace(/-/g, " ")}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Package size={28} style={{ color: muted }} />
              <p className="font-mono text-[11px] tracking-[0.25em]" style={{ color: muted }}>
                NO {activeCategory.toUpperCase()} PRODUCTS
              </p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-px">
              <AnimatePresence mode="popLayout">
                {filtered.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} onClick={() => openProduct(product)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl md:rounded-none overscroll-contain"
              style={{ background: isDark ? "#0a0a0a" : "#fff", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-2 md:hidden">
                <div className="w-8 h-1 rounded-full" style={{ background: border }} />
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs tracking-[0.2em] font-bold" style={{ color: fg }}>
                    {selectedProduct.sku}
                  </span>
                  {selectedProduct.category && (
                    <span
                      className="font-mono text-[8px] tracking-wider px-1.5 py-0.5"
                      style={{
                        background: getCatDot(categoryList, selectedProduct.category) + "22",
                        color: getCatDot(categoryList, selectedProduct.category),
                      }}
                    >
                      {selectedProduct.category.toUpperCase().replace(/-/g, " ")}
                    </span>
                  )}
                  <span
                    className="font-mono text-[8px] tracking-wider px-1.5 py-0.5"
                    style={{
                      background:
                        selectedProduct.status === "in-stock" ? "rgba(34,197,94,0.12)" :
                        selectedProduct.status === "low-stock" ? "rgba(234,179,8,0.12)" :
                        "rgba(239,68,68,0.12)",
                      color:
                        selectedProduct.status === "in-stock" ? "rgb(34,197,94)" :
                        selectedProduct.status === "low-stock" ? "rgb(234,179,8)" :
                        "rgb(239,68,68)",
                    }}
                  >
                    {selectedProduct.status === "in-stock" ? "IN STOCK" :
                     selectedProduct.status === "low-stock" ? `LOW STOCK · ${selectedProduct.stock} LEFT` :
                     "SOLD OUT"}
                  </span>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 active:scale-90" style={{ color: fg }}>
                  <X size={16} />
                </button>
              </div>

              {/* Gallery */}
              {(() => {
                const imgs = selectedProduct.images?.length ? selectedProduct.images : selectedProduct.image ? [selectedProduct.image] : [];
                const cur = imgs[galleryIndex] || imgs[0];
                const isVid = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u) || u.includes("/video/upload/");
                return (
                  <div className="relative">
                    <div className="aspect-square w-full overflow-hidden" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
                      {imgs.length ? (
                        isVid(cur) ? (
                          <video key={cur} src={cur} controls muted autoPlay playsInline preload="metadata" className="w-full h-full object-cover" />
                        ) : (
                          <img src={cur} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                          <GasclubLogo size={48} style={{ color: border }} accentColor={accent} />
                          <span className="font-mono text-xs tracking-[0.2em]" style={{ color: muted }}>{selectedProduct.name}</span>
                        </div>
                      )}
                    </div>
                    {imgs.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.max(0, galleryIndex - 1)); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", opacity: galleryIndex === 0 ? 0.3 : 1 }}>‹</button>
                        <button onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.min(imgs.length - 1, galleryIndex + 1)); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", opacity: galleryIndex === imgs.length - 1 ? 0.3 : 1 }}>›</button>
                        <div className="absolute bottom-2 right-2 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                          {galleryIndex + 1} / {imgs.length}
                        </div>
                        <div className="flex gap-1 p-2 overflow-x-auto no-scroll-bar" style={{ background: isDark ? "#0a0a0a" : "#f0f0f0" }}>
                          {imgs.map((img, idx) => (
                            <button key={idx} onClick={() => setGalleryIndex(idx)}
                              className="relative w-12 h-12 flex-shrink-0 overflow-hidden border-2 transition-all"
                              style={{ borderColor: idx === galleryIndex ? accent : "transparent", opacity: idx === galleryIndex ? 1 : 0.5 }}>
                              {isVid(img) ? (
                                <><video src={img} muted preload="metadata" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}><div className="w-0 h-0 ml-0.5 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white" /></div></div>
                                </>
                              ) : <img src={img} alt="" className="w-full h-full object-cover" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Urgency row */}
              <div className="flex items-center gap-4 px-5 py-2.5" style={{ background: isDark ? "#111" : "#f8f8f8", borderBottom: `1px solid ${border}` }}>
                {selectedProduct.viewers ? <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider" style={{ color: muted }}><Eye size={10} /> {selectedProduct.viewers} viewing</span> : null}
                {selectedProduct.recentOrders ? <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider" style={{ color: muted }}><Flame size={10} /> {selectedProduct.recentOrders} orders today</span> : null}
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="font-mono text-lg tracking-wider font-bold uppercase" style={{ color: fg }}>{selectedProduct.name}</h2>
                  <p className="text-base leading-relaxed mt-2" style={{ color: muted }}>{selectedProduct.description}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedProduct.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[8px] tracking-wider px-2 py-0.5 border" style={{ borderColor: border, color: muted }}>{tag.toUpperCase()}</span>
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs tracking-wider" style={{ color: muted }}>UNIT</span>
                  <span className="font-mono text-2xl font-bold" style={{ color: fg }}>${selectedProduct.price}</span>
                </div>
                {selectedProduct.bulk && (
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.2em] mb-2 block" style={{ color: muted }}>💼 BULK PRICING</span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.bulk.map((tier) => (
                        <button key={tier.label} onClick={() => setSelectedBulk(selectedBulk?.label === tier.label ? null : tier)}
                          className="border p-3 text-center transition-all active:scale-95"
                          style={{ borderColor: selectedBulk?.label === tier.label ? accent : border, background: selectedBulk?.label === tier.label ? surfaceAccent : "transparent" }}>
                          <span className="font-mono text-[10px] tracking-wider font-bold block" style={{ color: fg }}>{tier.qty}</span>
                          <span className="font-mono text-sm font-bold block mt-0.5" style={{ color: fg }}>${tier.price}</span>
                          <span className="font-mono text-[8px] tracking-wider block" style={{ color: muted }}>{tier.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!selectedBulk && (
                  <div className="flex items-center gap-4 py-3" style={{ borderTop: `1px solid ${border}` }}>
                    <span className="font-mono text-xs tracking-wider" style={{ color: muted }}>QTY</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center border active:scale-90" style={{ borderColor: border, color: fg }}><Minus size={14} /></button>
                      <span className="font-mono text-base font-bold w-10 text-center" style={{ color: fg }}>{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center border active:scale-90" style={{ borderColor: border, color: fg }}><Plus size={14} /></button>
                    </div>
                    <span className="ml-auto font-mono text-base font-bold" style={{ color: fg }}>${(selectedProduct.price * qty).toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Buy Bar */}
              <div className="sticky bottom-0 px-5 py-4" style={{ background: isDark ? "#0a0a0a" : "#fff", borderTop: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs tracking-wider" style={{ color: muted }}>
                    {selectedBulk ? selectedBulk.qty : `${qty} UNIT${qty > 1 ? "S" : ""}`}
                  </span>
                  <span className="font-mono text-xl font-bold" style={{ color: fg }}>${currentPrice}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAdd}
                    className="flex-1 py-4 font-mono text-xs tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{ background: accent, color: accentFg }}>
                    <ShoppingBag size={16} /> ADD TO CART
                  </button>
                  <button onClick={() => { handleAdd(); setTimeout(() => window.location.href = "/checkout", 300); }}
                    className="flex-1 py-4 font-mono text-xs tracking-[0.2em] flex items-center justify-center gap-2 border active:scale-[0.98] transition-transform"
                    style={{ borderColor: accent, color: accent }}>
                    <Zap size={16} /> BUY NOW
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
