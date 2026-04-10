"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { StockBadge } from "@/components/ui/stock-badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import {
  Package, Users, ShoppingCart, FileText, TrendingUp,
  Edit3, Check, X, RefreshCw, Truck, DollarSign,
  ChevronDown, Plus, Trash2, Pin, Star, Tag, Shield,
  Activity, Ticket, Image as ImageIcon, Hash, BarChart2,
  UserCheck, UserX, AlertCircle, Settings, Eye, EyeOff,
  Upload, GripVertical,
} from "lucide-react";
import { fetchProducts } from "@/lib/products";
import type { NormalizedProduct } from "@/lib/products";
import {
  createProductAction, updateProductAction, deleteProductAction,
  bulkUpdateProductsAction, bulkDeleteProductsAction,
  createPostAction, updatePostAction, deletePostAction
} from "@/app/actions/admin";
import {
  fetchPosts,
  fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  fetchAllUsers, updateUserRole,
  type DbPost,
} from "@/lib/community";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab = "overview" | "orders" | "inventory" | "community" | "users" | "settings";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-400/30",
  paid:       "bg-green-500/10  text-green-400  border-green-400/30",
  processing: "bg-blue-500/10   text-blue-400   border-blue-400/30",
  shipped:    "bg-purple-500/10 text-purple-400  border-purple-400/30",
  completed:  "bg-neutral-500/10 text-neutral-400 border-neutral-400/30",
  cancelled:  "bg-red-500/10    text-red-400     border-red-400/30",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:     "bg-white text-black",
  admin:           "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30",
  approved_buyer:  "bg-green-400/15 text-green-400 border border-green-400/30",
  member:          "border border-neutral-700 text-neutral-400",
};

// ── Helper: get stored admin session token ────────────────────────────────────
function getAdminToken(): string | null {
  try {
    const sess = sessionStorage.getItem("gc247_session");
    if (sess) {
      const parsed = JSON.parse(sess);
      return parsed.access_token || null;
    }
  } catch {}
  return null;
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// Upload-specific headers (no Content-Type — FormData sets its own boundary)
function adminUploadHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAdminToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Fallback: also send admin passkey stored in sessionStorage
  try {
    if (sessionStorage.getItem("gc247_admin") === "true") {
      headers["X-Admin-Key"] = "gc247_admin_verified";
    }
  } catch {}
  return headers;
}

// ── Admin Shell ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const { fg, border, isDark, muted, accent, accentFg, setBrightness, setColorProfile } = useTheme();
  const { user, isAdmin, loading } = useAuth();

  // Auto-apply admin theme (Midnight / dark) on first admin visit
  useEffect(() => {
    try {
      const hasAdminTheme = localStorage.getItem("gc247_admin_theme_set");
      if (!hasAdminTheme && isAdmin) {
        setBrightness(0);
        setColorProfile("Midnight");
        localStorage.setItem("gc247_admin_theme_set", "true");
      }
    } catch {}
  }, [isAdmin, setBrightness, setColorProfile]);

  // Wait for auth to hydrate from sessionStorage before gating
  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${muted}40`, borderTopColor: muted }} />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle size={32} style={{ color: muted }} />
          <p className="font-mono text-xs tracking-[0.2em]" style={{ color: muted }}>ACCESS DENIED</p>
        </div>
      </AppShell>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: typeof Package }[] = [
    { id: "overview",   label: "OVERVIEW",   icon: TrendingUp },
    { id: "orders",     label: "ORDERS",     icon: ShoppingCart },
    { id: "inventory",  label: "INVENTORY",  icon: Package },
    { id: "community",  label: "FEED",       icon: FileText },
    { id: "users",      label: "USERS",      icon: Users },
    { id: "settings",   label: "SETTINGS",   icon: Settings },
  ];

  return (
    <AppShell>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="pt-6 pb-5 mb-6" style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: muted }}>ADMIN DASHBOARD</span>
            <h1 className="font-mono text-base font-bold tracking-wider mt-0.5" style={{ color: fg }}>GASCLUB247</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-wider px-2 py-1" style={{ background: accent, color: accentFg }}>
              {user?.role?.replace("_", " ").toUpperCase() || "ADMIN"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scroll-bar gap-0.5 mb-8" style={{ borderBottom: `1px solid ${border}` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap transition-all border-b-2 -mb-px"
              style={{ color: isActive ? accent : muted, borderBottomColor: isActive ? accent : "transparent" }}
            >
              <Icon size={11} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview"   && <OverviewPanel />}
          {activeTab === "orders"     && <OrdersPanel />}
          {activeTab === "inventory"  && <InventoryPanel />}
          {activeTab === "community"  && <CommunityPanel />}
          {activeTab === "users"      && <UsersPanel />}
          {activeTab === "settings"   && <SettingsPanel />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW PANEL
// ══════════════════════════════════════════════════════════════════════════════
function OverviewPanel() {
  const { fg, border, muted, accent } = useTheme();
  const { session } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=100", { headers: adminHeaders() })
        .then(r => r.json()).then(d => d.orders || []).catch(() => []),
      fetchProducts(),
      fetchAllUsers(),
    ]).then(([orderData, productData, userData]) => {
      setOrders(orderData);
      setProducts(productData);
      setUsers(userData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const revenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const completedRevenue = orders
    .filter(o => o.status === "completed" || o.status === "paid")
    .reduce((s, o) => s + Number(o.total), 0);

  const stats = [
    { label: "PRODUCTS",       value: products.length,                                  icon: Package,      color: "" },
    { label: "MEMBERS",        value: users.length,                                     icon: Users,        color: "text-blue-400" },
    { label: "TOTAL ORDERS",   value: orders.length,                                    icon: Activity,     color: "" },
    { label: "PENDING ORDERS", value: orders.filter(o => o.status === "pending").length, icon: ShoppingCart, color: "text-yellow-400" },
    { label: "TOTAL REVENUE",  value: `$${revenue.toLocaleString()}`,                   icon: DollarSign,   color: "text-green-400" },
    { label: "COMPLETED REV.", value: `$${completedRevenue.toLocaleString()}`,           icon: DollarSign,   color: "text-green-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="border p-4 space-y-2" style={{ borderColor: border }}>
              <Icon size={14} style={{ color: accent }} />
              <div className={`font-mono text-xl font-bold ${stat.color}`} style={!stat.color ? { color: fg } : {}}>
                {loading ? "—" : stat.value}
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em]" style={{ color: muted }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={12} style={{ color: muted }} />
          <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: muted }}>RECENT ORDERS</span>
        </div>
        <div className="border divide-y" style={{ borderColor: border }}>
          {loading ? <Loader /> : orders.length === 0 ? <Empty label="No orders yet" /> :
            orders.slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3">
                <div>
                  <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>{o.order_number}</span>
                  <span className="font-mono text-[10px] ml-2" style={{ color: muted }}>{o.user_name || "Guest"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>${Number(o.total).toFixed(2)}</span>
                  <span className={`font-mono text-[8px] tracking-wider px-2 py-0.5 border ${STATUS_COLORS[o.status] || ""}`}>
                    {o.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Low stock alert */}
      {!loading && products.filter(p => p.status === "low-stock").length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={12} className="text-yellow-400" />
            <span className="font-mono text-[9px] tracking-[0.25em] text-yellow-400">LOW STOCK ALERT</span>
          </div>
          <div className="border divide-y border-yellow-400/20" style={{ background: "rgba(234,179,8,0.04)" }}>
            {products.filter(p => p.status === "low-stock").map(p => (
              <div key={p.id} className="flex items-center justify-between p-3">
                <span className="font-mono text-[10px]" style={{ color: fg }}>{p.name}</span>
                <span className="font-mono text-[10px] text-yellow-400">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function OrdersPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { session } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    const url = statusFilter === "all" ? "/api/orders?limit=100" : `/api/orders?status=${statusFilter}&limit=100`;
    fetch(url, { headers: adminHeaders() })
      .then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const patchOrder = async (orderId: string, body: object) => {
    setUpdatingId(orderId);
    await fetch("/api/orders", { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ orderId, ...body }) });
    setUpdatingId(null);
    load();
  };

  const statusBtns = ["all", "pending", "paid", "shipped", "completed", "cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {statusBtns.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="font-mono text-[9px] tracking-[0.15em] px-3 py-1.5 border whitespace-nowrap transition-all"
            style={{ background: statusFilter === s ? accent : "transparent", color: statusFilter === s ? accentFg : muted, borderColor: statusFilter === s ? accent : border }}
          >
            {s.toUpperCase()}
          </button>
        ))}
        <button onClick={load} className="p-1.5 border ml-auto flex-shrink-0 hover:opacity-70 transition-opacity" style={{ borderColor: border, color: muted }}>
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="font-mono text-[10px]" style={{ color: muted }}>
        {loading ? "..." : `${orders.length} ORDER${orders.length !== 1 ? "S" : ""}`}
      </div>

      <div className="border divide-y" style={{ borderColor: border }}>
        {loading ? <Loader /> : orders.length === 0 ? <Empty label="No orders found" /> :
          orders.map(order => {
            const items = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id}>
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>{order.order_number}</span>
                      <span className={`font-mono text-[8px] tracking-wider px-1.5 py-0.5 border ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-mono text-[9px] mt-0.5" style={{ color: muted }}>
                      {order.user_name || "Guest"} · {(order.payment_method || "").toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm font-bold" style={{ color: fg }}>${Number(order.total).toFixed(2)}</span>
                    <ChevronDown size={12} style={{ color: muted, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="p-4 space-y-5 border-t" style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>

                        {/* Items */}
                        <div>
                          <Label>ITEMS</Label>
                          {(items as Array<{ name?: string; qty?: number; price?: number; sku?: string }>).map((item, i) => (
                            <div key={i} className="flex justify-between font-mono text-[10px] py-0.5" style={{ color: fg }}>
                              <span>{item.name || item.sku || "?"} × {item.qty || 1}</span>
                              <span>${((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-mono text-[10px] pt-2 border-t mt-2" style={{ borderColor: border }}>
                            <span style={{ color: muted }}>TOTAL</span>
                            <span className="font-bold" style={{ color: fg }}>${Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Contact */}
                        {(order.user_email || order.address) && (
                          <div>
                            <Label>CONTACT</Label>
                            <p className="font-mono text-[10px]" style={{ color: fg }}>{order.user_email}</p>
                            {order.address && <p className="font-mono text-[10px] mt-0.5" style={{ color: muted }}>{[order.address, order.city, order.state, order.zip].filter(Boolean).join(", ")}</p>}
                          </div>
                        )}

                        {order.notes && (
                          <div>
                            <Label>NOTES</Label>
                            <p className="font-mono text-[10px]" style={{ color: fg }}>{order.notes}</p>
                          </div>
                        )}

                        {/* Status */}
                        <div>
                          <Label>UPDATE STATUS</Label>
                          <div className="flex gap-2 flex-wrap">
                            {["pending", "paid", "shipped", "completed", "cancelled"].map(s => (
                              <button key={s} onClick={() => patchOrder(order.id, { status: s })} disabled={updatingId === order.id || order.status === s}
                                className="font-mono text-[9px] px-2.5 py-1 border transition-all disabled:opacity-40"
                                style={{ borderColor: order.status === s ? accent : border, color: order.status === s ? accent : muted, background: order.status === s ? `${accent}15` : "transparent" }}
                              >
                                {s.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tracking */}
                        <div>
                          <Label>TRACKING NUMBER</Label>
                          <div className="flex gap-2">
                            <input value={trackingInputs[order.id] ?? (order.tracking_number || "")}
                              onChange={e => setTrackingInputs(p => ({ ...p, [order.id]: e.target.value }))}
                              placeholder="Enter tracking #…"
                              className="flex-1 bg-transparent border px-3 py-2 font-mono text-[10px] outline-none"
                              style={{ borderColor: border, color: fg }}
                            />
                            <button onClick={() => patchOrder(order.id, { trackingNumber: trackingInputs[order.id] || "" })}
                              disabled={updatingId === order.id}
                              className="px-3 py-2 border font-mono text-[9px] flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-40"
                              style={{ borderColor: accent, color: accent }}
                            >
                              <Truck size={10} /> SAVE
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEDIA GALLERY UPLOADER — Multi-image + Video support (up to 6 slots)
// ══════════════════════════════════════════════════════════════════════════════
const MEDIA_ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MEDIA_ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MEDIA_ALLOWED_ALL = [...MEDIA_ALLOWED_IMAGE, ...MEDIA_ALLOWED_VIDEO];
const MEDIA_MAX_IMAGE = 10 * 1024 * 1024;
const MEDIA_MAX_VIDEO = 50 * 1024 * 1024;
const MAX_MEDIA_SLOTS = 6;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video/upload/");
}

function MediaGalleryUploader({
  mediaItems, onAdd, onRemove, onReorder, uploadingIndex, label = "PRODUCT MEDIA",
}: {
  mediaItems: MediaItem[];
  onAdd: (file: File, slotIndex: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  uploadingIndex: number | null;
  label?: string;
}) {
  const { fg, border, muted, accent, isDark } = useTheme();
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const validateFile = (file: File): boolean => {
    setErrorMsg("");
    const isVideo = MEDIA_ALLOWED_VIDEO.includes(file.type);
    const isImage = MEDIA_ALLOWED_IMAGE.includes(file.type);
    if (!isImage && !isVideo) {
      setErrorMsg(`Invalid format. Use JPEG, PNG, WebP, GIF, MP4, or WebM.`);
      return false;
    }
    const maxSize = isVideo ? MEDIA_MAX_VIDEO : MEDIA_MAX_IMAGE;
    if (file.size > maxSize) {
      setErrorMsg(`File too large (${formatFileSize(file.size)}). Max ${isVideo ? "50 MB" : "10 MB"}.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, slotIndex: number) => {
    e.preventDefault();
    setDraggingSlot(null);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) onAdd(file, slotIndex);
  };

  const slots = Array.from({ length: MAX_MEDIA_SLOTS }, (_, i) => mediaItems[i] || null);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: muted }}>{label}</span>
        <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
          {mediaItems.length}/{MAX_MEDIA_SLOTS} SLOTS
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((item, i) => {
          const isUploading = uploadingIndex === i;
          const isEmpty = !item;
          const isPrimary = i === 0;
          const isVid = item ? item.type === "video" : false;

          return (
            <div key={i} className="relative aspect-square">
              {item ? (
                /* ── Filled slot ── */
                <div className="relative w-full h-full group border overflow-hidden" style={{ borderColor: isPrimary ? accent : border }}>
                  {isVid ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                          <div className="w-0 h-0 ml-0.5 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                  )}

                  {/* Primary badge */}
                  {isPrimary && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 font-mono text-[7px] tracking-wider" style={{ background: accent, color: "#000" }}>
                      COVER
                    </div>
                  )}

                  {/* Video badge */}
                  {isVid && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 font-mono text-[7px] tracking-wider bg-blue-500 text-white">
                      VIDEO
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    <div className="flex gap-1">
                      {i > 0 && (
                        <button onClick={() => onReorder(i, i - 1)} className="px-1.5 py-0.5 font-mono text-[7px] border border-white/30 text-white hover:bg-white/10">
                          ← 
                        </button>
                      )}
                      {i < mediaItems.length - 1 && (
                        <button onClick={() => onReorder(i, i + 1)} className="px-1.5 py-0.5 font-mono text-[7px] border border-white/30 text-white hover:bg-white/10">
                           →
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(i)}
                      className="px-2 py-0.5 font-mono text-[7px] tracking-wider border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Empty slot ── */
                <div
                  onDrop={e => handleDrop(e, i)}
                  onDragOver={e => { e.preventDefault(); setDraggingSlot(i); }}
                  onDragLeave={() => setDraggingSlot(null)}
                  onClick={() => {
                    if (!isUploading && i <= mediaItems.length) fileRefs.current[i]?.click();
                  }}
                  className={`w-full h-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                    i <= mediaItems.length ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
                  }`}
                  style={{
                    borderColor: draggingSlot === i ? accent : border,
                    background: draggingSlot === i ? `${accent}10` : (isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.01)"),
                  }}
                >
                  {isUploading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accent}30`, borderTopColor: accent }} />
                      <span className="font-mono text-[7px] tracking-wider" style={{ color: accent }}>UPLOADING</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} style={{ color: i <= mediaItems.length ? muted : `${muted}40` }} />
                      <span className="font-mono text-[7px] tracking-wider text-center px-1" style={{ color: i <= mediaItems.length ? muted : `${muted}40` }}>
                        {isPrimary && mediaItems.length === 0 ? "COVER" : `SLOT ${i + 1}`}
                      </span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={el => { fileRefs.current[i] = el; }}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f && validateFile(f)) onAdd(f, i);
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[8px] tracking-wider mt-2" style={{ color: muted }}>
        JPEG, PNG, WebP, GIF · Max 10 MB &nbsp;|&nbsp; MP4, WebM · Max 50 MB
      </p>

      {errorMsg && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 border" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
          <span className="font-mono text-[9px] text-red-400 flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:opacity-70 flex-shrink-0">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// Keep the single-image ImageUploadZone for feed posts (they don't need multi-media)
function ImageUploadZone({
  imageUrl, onUpload, onClear, uploading, label = "POST IMAGE",
}: {
  imageUrl: string;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
  label?: string;
}) {
  const { fg, border, muted, accent, isDark } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); };

  return (
    <div>
      <span className="font-mono text-[9px] tracking-[0.2em] block mb-2" style={{ color: muted }}>{label}</span>
      {imageUrl ? (
        <div className="relative group">
          <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover border" style={{ borderColor: border, maxHeight: 180 }} />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 font-mono text-[9px] tracking-wider border border-white/30 text-white hover:bg-white/10 transition-colors">REPLACE</button>
            <button onClick={onClear} className="px-3 py-1.5 font-mono text-[9px] tracking-wider border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors">REMOVE</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 py-6"
          style={{ borderColor: dragging ? accent : border, background: dragging ? `${accent}10` : "transparent" }}
        >
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accent}40`, borderTopColor: accent }} /><span className="font-mono text-[9px]" style={{ color: accent }}>UPLOADING...</span></>
          ) : (
            <><Upload size={16} style={{ color: muted }} /><p className="font-mono text-[9px]" style={{ color: fg }}>Drop image or click to upload</p></>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} disabled={uploading} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVENTORY PANEL
// ══════════════════════════════════════════════════════════════════════════════
function InventoryPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingSlotIdx, setUploadingSlotIdx] = useState<number | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Inline quick-edit state
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: "price" | "stock"; value: string } | null>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbUploadId, setThumbUploadId] = useState<string | null>(null);

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length && products.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map(p => p.id)));
  };

  const handleBulkAction = async (action: "hide" | "sold-out" | "delete") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Apply action "${action}" to ${selectedIds.size} selected products?`)) return;
    
    setSaving(true);
    const token = getAdminToken();
    const idsArray = Array.from(selectedIds);
    
    if (action === "delete") {
      await bulkDeleteProductsAction(token, idsArray);
      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
    } else if (action === "sold-out") {
      const updates = { stock: 0, status: "sold-out" };
      await bulkUpdateProductsAction(token, idsArray, updates);
      setProducts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, stock: 0, status: "sold-out" as any } : p));
    } else if (action === "hide") {
      // Loop individually to preserve other tags
      for (const id of idsArray) {
        const p = products.find(prod => prod.id === id);
        if (p && !p.tags.includes("hidden")) {
          const newTags = [...p.tags, "hidden"];
          await updateProductAction(token, id, { tags: newTags });
        }
      }
      setProducts(prev => prev.map(p => selectedIds.has(p.id) && !p.tags.includes("hidden") ? { ...p, tags: [...p.tags, "hidden"] } : p));
    }
    
    setSelectedIds(new Set());
    setSaving(false);
    showToast(`Bulk ${action} complete`);
  };

  // Modal state — single modal for both create and edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: "", name: "", category: "featured", price: "", stock: "",
    description: "", tags: "", featured: false,
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [formError, setFormError] = useState("");

  const categories = ["featured", "exotic", "candy", "gas", "premium", "prerolls", "smalls"];

  useEffect(() => { fetchProducts().then(d => { setProducts(d); setLoading(false); }); }, []);

  // ── Media upload handler (targets a specific slot) ──
  const handleMediaAdd = async (file: File, slotIndex: number) => {
    setUploading(true);
    setUploadingSlotIdx(slotIndex);
    setFormError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `gasclub247/products/${form.category}`);
      const res = await fetch("/api/upload", { method: "POST", body: fd, headers: adminUploadHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || `Upload failed (${res.status})`);
      } else if (data.optimizedUrl || data.url) {
        const newItem: MediaItem = {
          url: data.optimizedUrl || data.url,
          type: data.mediaType === "video" ? "video" : "image",
        };
        setMediaItems(prev => {
          const updated = [...prev];
          if (slotIndex < updated.length) {
            updated[slotIndex] = newItem; // Replace existing
          } else {
            updated.push(newItem); // Add new
          }
          return updated;
        });
      } else {
        setFormError("Upload returned no URL");
      }
    } catch (err: any) {
      setFormError(err?.message || "Upload failed. Check connection.");
    }
    setUploading(false);
    setUploadingSlotIdx(null);
  };

  const handleMediaRemove = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaReorder = (from: number, to: number) => {
    setMediaItems(prev => {
      const updated = [...prev];
      const [item] = updated.splice(from, 1);
      updated.splice(to, 0, item);
      return updated;
    });
  };

  // ── Open modal for new product ──
  const openCreate = () => {
    setModalMode("create");
    setEditorId(null);
    setForm({ sku: "", name: "", category: "featured", price: "", stock: "", description: "", tags: "", featured: false });
    setMediaItems([]);
    setFormError("");
    setModalOpen(true);
  };

  // ── Open modal to edit existing product ──
  const openEdit = (p: NormalizedProduct) => {
    setModalMode("edit");
    setEditorId(p.id);
    setForm({
      sku: p.sku || "", name: p.name, category: p.category || "featured",
      price: String(p.price), stock: String(p.stock),
      description: p.description || "",
      tags: (p.tags || []).join(", "), featured: p.featured || false,
    });
    // Populate media items from existing product
    const items: MediaItem[] = [];
    if (p.image) items.push({ url: p.image, type: isVideoUrl(p.image) ? "video" : "image" });
    if (p.images && p.images.length > 0) {
      for (const url of p.images) {
        if (url && url !== p.image) {
          items.push({ url, type: isVideoUrl(url) ? "video" : "image" });
        }
      }
    }
    setMediaItems(items);
    setFormError("");
    setModalOpen(true);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!form.name || !form.price) { setFormError("Name and Price are required."); return; }
    if (modalMode === "create" && !form.sku) { setFormError("SKU is required for new products."); return; }
    setFormError("");
    setSaving(true);

    const coverUrl = mediaItems[0]?.url || "";
    const allUrls = mediaItems.map(m => m.url);

    const token = getAdminToken();

    if (modalMode === "create") {
      const result = await createProductAction(token, {
        sku: form.sku, name: form.name, category: form.category,
        price: Number(form.price), stock: Number(form.stock) || 0,
        description: form.description, imageUrl: coverUrl || undefined,
        images: allUrls,
      });
      if (result.success) {
        setModalOpen(false);
        fetchProducts().then(setProducts);
        showToast("Product added successfully");
      } else {
        setFormError(result.error || "Failed to add product");
      }
    } else if (editorId) {
      const newStock = Number(form.stock);
      const newStatus = newStock === 0 ? "sold-out" : newStock <= 10 ? "low-stock" : "in-stock";
      const tagArr = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const isHidden = tagArr.includes("hidden");
      const result = await updateProductAction(token, editorId, {
        name: form.name, price: Number(form.price), stock: newStock,
        status: isHidden ? "sold-out" : newStatus,
        description: form.description, category: form.category,
        tags: tagArr, featured: form.featured,
        image_url: coverUrl || undefined,
        images: allUrls,
      });
      if (result.success) {
        setProducts(prev => prev.map(p => p.id === editorId ? {
          ...p, name: form.name, price: Number(form.price), stock: newStock,
          status: (isHidden ? "sold-out" : newStatus) as any,
          description: form.description, category: form.category,
          tags: tagArr, featured: form.featured,
          image: coverUrl || p.image,
          images: allUrls,
        } : p));
        setModalOpen(false);
        showToast("Product updated");
      } else {
        setFormError(result.error || "Failed to update product");
      }
    }
    setSaving(false);
  };

  // ── Inline quick-edit save ──
  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    const { id, field, value } = inlineEdit;
    const numVal = Number(value);
    if (isNaN(numVal) || numVal < 0) { setInlineEdit(null); return; }

    const product = products.find(p => p.id === id);
    if (!product) { setInlineEdit(null); return; }

    const updates: any = {};
    if (field === "price") updates.price = numVal;
    if (field === "stock") {
      updates.stock = numVal;
      updates.status = numVal === 0 ? "sold-out" : numVal <= 10 ? "low-stock" : "in-stock";
    }

    const token = getAdminToken();
    const result = await updateProductAction(token, id, updates);
    if (result.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    } else {
      showToast(result.error || `Failed to update ${field}`, "error");
    }
    setInlineEdit(null);
  };

  // ── Thumbnail image swap ──
  const handleThumbUpload = async (file: File, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setThumbUploadId(productId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `gasclub247/products/${product.category || "featured"}`);
      const res = await fetch("/api/upload", { method: "POST", body: fd, headers: adminUploadHeaders() });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || `Upload failed (${res.status})`, "error");
      } else {
        const newUrl = data.optimizedUrl || data.url;
        if (newUrl) {
          const token = getAdminToken();
          const result = await updateProductAction(token, productId, { image_url: newUrl });
          if (result.success) {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, image: newUrl } : p));
            showToast("Image updated");
          } else {
            showToast(result.error || "Failed to save image", "error");
          }
        } else {
          showToast("Upload returned no URL", "error");
        }
      }
    } catch (err: any) {
      showToast(err?.message || "Image upload failed", "error");
    }
    setThumbUploadId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const token = getAdminToken();
    const result = await deleteProductAction(token, id);
    if (result.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`"${name}" deleted`);
    } else {
      showToast(result.error || "Delete failed", "error");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] font-mono text-[10px] tracking-wider px-5 py-2.5 flex items-center gap-2"
            style={{
              background: toast.type === "success" ? accent : "rgb(239,68,68)",
              color: toast.type === "success" ? accentFg : "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {toast.type === "success" ? <Check size={12} /> : <X size={12} />}
            {toast.message.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for thumbnail image swap */}
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          const id = thumbInputRef.current?.dataset.productId;
          if (f && id) handleThumbUpload(f, id);
          if (thumbInputRef.current) thumbInputRef.current.value = "";
        }}
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
          {loading ? "..." : `${products.length} PRODUCTS`}
        </span>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider transition-all active:scale-95"
          style={{ background: accent, color: accentFg }}
        >
          <Plus size={12} /> ADD PRODUCT
        </button>
      </div>

      {/* ── Product Editor Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain border"
              style={{ background: isDark ? "#0a0a0a" : "#fff", borderColor: border }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: border }}>
                <div className="flex items-center gap-2">
                  <Package size={14} style={{ color: accent }} />
                  <span className="font-mono text-[10px] tracking-[0.2em] font-bold" style={{ color: fg }}>
                    {modalMode === "create" ? "NEW PRODUCT" : "EDIT PRODUCT"}
                  </span>
                </div>
                <button onClick={() => !saving && setModalOpen(false)} className="p-1 hover:opacity-60 transition-opacity" style={{ color: muted }}>
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* ── Section: Basic Info ── */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag size={11} style={{ color: accent }} />
                    <span className="font-mono text-[8px] tracking-[0.25em]" style={{ color: muted }}>BASIC INFO</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {modalMode === "create" && (
                      <AdminInput label="SKU" value={form.sku} onChange={v => setForm(p => ({ ...p, sku: v }))} placeholder="TC-PLMC-01" />
                    )}
                    <AdminInput label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="PLATINUM LEMON CHERRY" />
                    <AdminInput label="PRICE ($)" value={form.price} onChange={v => setForm(p => ({ ...p, price: v }))} placeholder="120" type="number" />
                    <AdminInput label="STOCK" value={form.stock} onChange={v => setForm(p => ({ ...p, stock: v }))} placeholder="50" type="number" />
                  </div>
                  <div className="mt-3">
                    <span className="font-mono text-[9px] tracking-wider block mb-1.5" style={{ color: muted }}>CATEGORY</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {categories.map(c => (
                        <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                          className="font-mono text-[8px] px-2.5 py-1 border transition-all"
                          style={{
                            borderColor: form.category === c ? accent : border,
                            color: form.category === c ? accent : muted,
                            background: form.category === c ? `${accent}15` : "transparent",
                          }}
                        >
                          {c.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Section: Product Media ── */}
                <div className="border-t pt-4" style={{ borderColor: border }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <ImageIcon size={11} style={{ color: accent }} />
                    <span className="font-mono text-[8px] tracking-[0.25em]" style={{ color: muted }}>PRODUCT MEDIA</span>
                  </div>
                  <MediaGalleryUploader
                    mediaItems={mediaItems}
                    onAdd={handleMediaAdd}
                    onRemove={handleMediaRemove}
                    onReorder={handleMediaReorder}
                    uploadingIndex={uploadingSlotIdx}
                  />
                </div>

                {/* ── Section: Details ── */}
                <div className="border-t pt-4" style={{ borderColor: border }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText size={11} style={{ color: accent }} />
                    <span className="font-mono text-[8px] tracking-[0.25em]" style={{ color: muted }}>DETAILS</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>DESCRIPTION</span>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Strain description, effects, genetics…"
                        rows={3}
                        className="w-full bg-transparent border px-3 py-2 font-mono text-[10px] tracking-wider outline-none resize-none leading-relaxed"
                        style={{ borderColor: border, color: fg }}
                      />
                    </div>
                    <AdminInput label="TAGS (comma separated)" value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="popular, featured, in stock" />
                  </div>
                </div>

                {/* ── Section: Visibility ── */}
                <div className="border-t pt-4" style={{ borderColor: border }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Eye size={11} style={{ color: accent }} />
                    <span className="font-mono text-[8px] tracking-[0.25em]" style={{ color: muted }}>VISIBILITY & SETTINGS</span>
                  </div>
                  <div className="space-y-3">
                    {/* Featured Toggle */}
                    <div className="flex items-center justify-between p-3 border" style={{ borderColor: form.featured ? accent : border, background: form.featured ? `${accent}08` : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <Star size={12} style={{ color: form.featured ? accent : muted }} />
                        <div>
                          <span className="font-mono text-[9px] tracking-wider block" style={{ color: fg }}>FEATURED PRODUCT</span>
                          <span className="font-mono text-[8px]" style={{ color: muted }}>Show in featured section on homepage</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, featured: !p.featured }))}
                        className="relative w-9 h-5 rounded-full transition-colors duration-200"
                        style={{ background: form.featured ? accent : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') }}
                      >
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200" style={{ transform: form.featured ? 'translateX(16px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                    {/* Hidden Toggle */}
                    <div className="flex items-center justify-between p-3 border" style={{ borderColor: form.tags.includes('hidden') ? 'rgba(239,68,68,0.4)' : border, background: form.tags.includes('hidden') ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <EyeOff size={12} style={{ color: form.tags.includes('hidden') ? 'rgb(239,68,68)' : muted }} />
                        <div>
                          <span className="font-mono text-[9px] tracking-wider block" style={{ color: fg }}>HIDDEN FROM STORE</span>
                          <span className="font-mono text-[8px]" style={{ color: muted }}>Product won't appear in public store</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const curTags = form.tags.split(',').map(t => t.trim()).filter(t => t && t !== 'hidden');
                          if (!form.tags.includes('hidden')) curTags.push('hidden');
                          setForm(p => ({ ...p, tags: curTags.join(', ') }));
                        }}
                        className="relative w-9 h-5 rounded-full transition-colors duration-200"
                        style={{ background: form.tags.includes('hidden') ? 'rgb(239,68,68)' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') }}
                      >
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200" style={{ transform: form.tags.includes('hidden') ? 'translateX(16px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Error ── */}
                {formError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[9px] text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2">
                    {formError}
                  </motion.p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-4 border-t" style={{ borderColor: border }}>
                <button onClick={handleSave} disabled={saving || uploading}
                  className="flex-1 py-2.5 font-mono text-[10px] tracking-[0.15em] font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
                  style={{ background: accent, color: accentFg }}
                >
                  {saving ? "SAVING..." : modalMode === "create" ? "ADD PRODUCT" : "SAVE CHANGES"}
                </button>
                <button onClick={() => !saving && setModalOpen(false)}
                  className="px-5 py-2.5 font-mono text-[10px] tracking-wider border transition-all"
                  style={{ borderColor: border, color: muted }}
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk Actions Bar ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 border mb-3"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderColor: accent }}
          >
            <div className="flex items-center gap-3">
               <span className="font-mono text-[10px] font-bold" style={{ color: fg }}>
                  {selectedIds.size} SELECTED
               </span>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => handleBulkAction("hide")} className="px-3 py-1.5 border font-mono text-[9px] tracking-wider transition-opacity hover:opacity-70" style={{ borderColor: border, color: fg }}>HIDE</button>
               <button onClick={() => handleBulkAction("sold-out")} className="px-3 py-1.5 border font-mono text-[9px] tracking-wider transition-opacity hover:opacity-70" style={{ borderColor: border, color: "rgb(234,179,8)" }}>MARK SOLD OUT</button>
               <button onClick={() => handleBulkAction("delete")} className="px-3 py-1.5 border font-mono text-[9px] tracking-wider transition-opacity hover:opacity-70" style={{ borderColor: 'rgba(239,68,68,0.5)', color: 'rgb(239,68,68)' }}>DELETE</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Products Grid ── */}
      <div className="border divide-y" style={{ borderColor: border }}>
        <div className="hidden md:grid grid-cols-[30px_1fr_80px_70px_60px_80px_100px] gap-2 px-3 py-2 font-mono text-[9px] tracking-[0.15em]" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", color: muted }}>
          <div className="flex items-center justify-center">
            <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleSelectAll} className="w-3 h-3 accent-current" style={{ accentColor: accent }} />
          </div>
          <span>PRODUCT</span>
          <span>CATEGORY</span>
          <span>PRICE</span>
          <span>STOCK</span>
          <span>STATUS</span>
          <span className="text-right">ACTIONS</span>
        </div>

        {loading ? <Loader /> : products.length === 0 ? <Empty label="No products yet" /> : products.map(p => (
          <div key={p.id} className="group px-3 py-3 hover:bg-white/[0.02] transition-colors" style={{ background: selectedIds.has(p.id) ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)") : "transparent" }}>
            {/* Mobile card layout */}
            <div className="flex items-center gap-3 md:grid md:grid-cols-[30px_1fr_80px_70px_60px_80px_100px] md:gap-2 md:items-center">
              <div className="flex items-center justify-center">
                 <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} className="w-3 h-3 accent-current" style={{ accentColor: accent }} />
              </div>
              {/* Product name + clickable thumb (for image swap) */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {p.image ? (
                  <button
                    onClick={() => {
                      if (thumbInputRef.current) {
                        thumbInputRef.current.dataset.productId = p.id;
                        thumbInputRef.current.click();
                      }
                    }}
                    className="relative w-11 h-11 flex-shrink-0 group/thumb cursor-pointer"
                    title="Click to replace image"
                  >
                    <img src={p.image} alt="" className="w-11 h-11 object-cover border" style={{ borderColor: border }} />
                    {thumbUploadId === p.id ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent }} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (thumbInputRef.current) {
                        thumbInputRef.current.dataset.productId = p.id;
                        thumbInputRef.current.click();
                      }
                    }}
                    className="w-11 h-11 border flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ borderColor: border }}
                    title="Click to upload image"
                  >
                    {thumbUploadId === p.id ? (
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent }} />
                    ) : (
                      <Upload size={12} style={{ color: muted }} />
                    )}
                  </button>
                )}
                <div className="min-w-0">
                  <span className="font-mono text-[10px] font-medium truncate block" style={{ color: fg }}>
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.sku && <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>{p.sku}</span>}
                    {p.featured && <Star size={8} className="text-yellow-400 fill-yellow-400" />}
                    {p.tags?.includes("hidden") && <span className="font-mono text-[7px] text-red-400 tracking-wider border border-red-400/30 px-1 py-px">HIDDEN</span>}
                  </div>
                </div>
              </div>
              {/* Desktop columns — inline editable price & stock */}
              <span className="hidden md:block font-mono text-[9px] uppercase truncate" style={{ color: muted }}>{p.category}</span>
              {/* Price — click to edit */}
              <div className="hidden md:block">
                {inlineEdit?.id === p.id && inlineEdit.field === "price" ? (
                  <input
                    ref={inlineInputRef}
                    type="number"
                    value={inlineEdit.value}
                    onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                    onBlur={saveInlineEdit}
                    onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                    className="w-full bg-transparent border px-1.5 py-0.5 font-mono text-[10px] font-medium outline-none"
                    style={{ borderColor: accent, color: fg, width: 60 }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setInlineEdit({ id: p.id, field: "price", value: String(p.price) })}
                    className="font-mono text-[10px] font-medium hover:underline cursor-pointer transition-colors"
                    style={{ color: fg }}
                    title="Click to edit price"
                  >
                    ${p.price}
                  </button>
                )}
              </div>
              {/* Stock — click to edit */}
              <div className="hidden md:block">
                {inlineEdit?.id === p.id && inlineEdit.field === "stock" ? (
                  <input
                    ref={inlineInputRef}
                    type="number"
                    value={inlineEdit.value}
                    onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                    onBlur={saveInlineEdit}
                    onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                    className="w-full bg-transparent border px-1.5 py-0.5 font-mono text-[10px] outline-none"
                    style={{ borderColor: accent, color: p.stock <= 10 ? "rgb(234,179,8)" : fg, width: 50 }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setInlineEdit({ id: p.id, field: "stock", value: String(p.stock) })}
                    className="font-mono text-[10px] hover:underline cursor-pointer transition-colors"
                    style={{ color: p.stock <= 10 ? "rgb(234,179,8)" : fg }}
                    title="Click to edit stock"
                  >
                    {p.stock}
                  </button>
                )}
              </div>
              <div className="hidden md:block"><StockBadge status={p.status} /></div>
              {/* Actions */}
              <div className="flex gap-1 items-center md:justify-end flex-shrink-0">
                <span className="md:hidden font-mono text-[10px] font-medium mr-1" style={{ color: fg }}>${p.price}</span>
                <div className="md:hidden mr-1"><StockBadge status={p.status} /></div>
                <button onClick={() => openEdit(p)} className="p-1.5 hover:opacity-60 transition-opacity" style={{ color: accent }} title="Edit product">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id} className="p-1.5 hover:text-red-400 transition-colors disabled:opacity-40" style={{ color: muted }} title="Delete product">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "update" as DbPost["type"], title: "", content: "", pinned: false, featured: false, imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", imageUrl: "", type: "update" as DbPost["type"] });
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [uploadingCreate, setUploadingCreate] = useState(false);

  useEffect(() => { fetchPosts().then(d => { setPosts(d); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const token = getAdminToken();
    const result = await createPostAction(token, {
      type: form.type, title: form.title, content: form.content,
      authorId: user?.id, authorName: user?.displayName || "GASCLUB247",
      imageUrl: form.imageUrl || undefined, pinned: form.pinned, featured: form.featured,
    });
    if (result.success && result.post) {
      setPosts(prev => [result.post!, ...prev]);
      setForm({ type: "update", title: "", content: "", pinned: false, featured: false, imageUrl: "" });
      setShowCreate(false);
    }
    setSaving(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    setDeletingId(postId);
    const token = getAdminToken();
    await deletePostAction(token, postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDeletingId(null);
  };

  const handleTogglePin = async (post: DbPost) => {
    const token = getAdminToken();
    await updatePostAction(token, post.id, { pinned: !post.pinned });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p));
  };

  const handleToggleVisibility = async (post: DbPost & { hidden?: boolean }) => {
    const nowHidden = !(post as any).hidden;
    const token = getAdminToken();
    await updatePostAction(token, post.id, { hidden: nowHidden } as any);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, hidden: nowHidden } as any : p));
  };

  const startEdit = (post: DbPost) => {
    setEditingId(post.id);
    setEditForm({ title: post.title, content: post.content, imageUrl: post.image_url || "", type: post.type });
  };

  const saveEdit = async (postId: string) => {
    setSaving(true);
    const token = getAdminToken();
    await updatePostAction(token, postId, {
      title: editForm.title,
      content: editForm.content,
      image_url: editForm.imageUrl || null,
      type: editForm.type,
    });
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, title: editForm.title, content: editForm.content,
      image_url: editForm.imageUrl || null, type: editForm.type,
    } : p));
    setEditingId(null);
    setSaving(false);
  };

  const handleEditImageUpload = async (file: File) => {
    setUploadingEdit(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gasclub247/posts");
      const res = await fetch("/api/upload", { method: "POST", body: formData, headers: adminUploadHeaders() });
      const data = await res.json();
      if (res.ok) {
        setEditForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
      }
    } catch {}
    setUploadingEdit(false);
  };

  const handleCreateImageUpload = async (file: File) => {
    setUploadingCreate(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gasclub247/posts");
      const res = await fetch("/api/upload", { method: "POST", body: formData, headers: adminUploadHeaders() });
      const data = await res.json();
      if (res.ok) {
        setForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
      }
    } catch {}
    setUploadingCreate(false);
  };

  const POST_TYPES: Array<"drop"|"update"|"media"|"review"|"promo"> = ["drop", "update", "media", "review", "promo"];
  const TYPE_COLORS: Record<string, string> = { drop: "text-purple-400", update: "text-blue-400", media: "text-green-400", review: "text-yellow-400", promo: "text-orange-400" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
          {loading ? "..." : `${posts.length} POSTS`}
        </span>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider"
          style={{ background: accent, color: accentFg }}
        >
          <Plus size={12} /> NEW DROP
        </button>
      </div>

      {/* Create post form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border overflow-hidden" style={{ borderColor: accent }}
          >
            <div className="p-4 space-y-3">
              <Label>NEW DROP / UPDATE</Label>

              {/* Type */}
              <div className="flex gap-2 flex-wrap">
                {POST_TYPES.map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                    className="font-mono text-[9px] px-2 py-1 border transition-all"
                    style={{ borderColor: form.type === t ? accent : border, color: form.type === t ? accent : muted, background: form.type === t ? `${accent}15` : "transparent" }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              <AdminInput label="Title" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Post title…" />
              <div>
                <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>CONTENT</span>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write your post…" rows={4}
                  className="w-full bg-transparent border px-3 py-2 font-mono text-[10px] tracking-wider outline-none resize-none leading-relaxed"
                  style={{ borderColor: border, color: fg }}
                />
              </div>

              {/* Image upload */}
              <div>
                <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>POST IMAGE</span>
                <div className="flex gap-2">
                  <label
                    className="flex-1 border border-dashed px-3 py-2 font-mono text-[10px] tracking-wider cursor-pointer text-center transition-all hover:opacity-70"
                    style={{ borderColor: border, color: muted }}
                  >
                    {uploadingCreate ? "UPLOADING..." : form.imageUrl ? "✅ IMAGE UPLOADED" : "📷 CLICK TO UPLOAD"}
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCreateImageUpload(f); }} disabled={uploadingCreate} />
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.imageUrl} alt="Preview" className="w-12 h-12 object-cover border" style={{ borderColor: border }} />
                    <button className="font-mono text-[8px] tracking-wider hover:opacity-70" style={{ color: muted }}
                      onClick={() => setForm(p => ({ ...p, imageUrl: "" }))}
                    >
                      REMOVE
                    </button>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="w-3 h-3" />
                  <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>PIN POST</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-3 h-3" />
                  <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>FEATURE</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={saving || !form.title || !form.content}
                  className="flex-1 py-2 font-mono text-[10px] tracking-wider disabled:opacity-50"
                  style={{ background: accent, color: accentFg }}
                >
                  {saving ? "POSTING..." : "PUBLISH POST"}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-2 font-mono text-[10px] border"
                  style={{ borderColor: border, color: muted }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts list */}
      <div className="space-y-2">
        {loading ? <Loader /> : posts.length === 0 ? <Empty label="No posts yet" /> :
          posts.map(post => {
            const isEditing = editingId === post.id;
            const isHidden = (post as any).hidden;
            return (
            <div key={post.id} className="border p-4" style={{ borderColor: border, background: post.pinned ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)") : "transparent", opacity: isHidden ? 0.5 : 1 }}>
              {isEditing ? (
                /* ── Inline Edit Mode ── */
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {POST_TYPES.map(t => (
                      <button key={t} onClick={() => setEditForm(p => ({ ...p, type: t }))}
                        className="font-mono text-[8px] px-2 py-0.5 border transition-all"
                        style={{ borderColor: editForm.type === t ? accent : border, color: editForm.type === t ? accent : muted, background: editForm.type === t ? `${accent}15` : "transparent" }}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <AdminInput label="TITLE" value={editForm.title} onChange={v => setEditForm(p => ({ ...p, title: v }))} />
                  <div>
                    <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>CONTENT</span>
                    <textarea value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
                      rows={3} className="w-full bg-transparent border px-3 py-2 font-mono text-[10px] tracking-wider outline-none resize-none"
                      style={{ borderColor: border, color: fg }}
                    />
                  </div>
                  {/* Edit image */}
                  <div>
                    <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>IMAGE</span>
                    <div className="flex gap-2 items-center">
                      {editForm.imageUrl && <img src={editForm.imageUrl} alt="" className="w-10 h-10 object-cover border" style={{ borderColor: border }} />}
                      <label className="flex-1 border border-dashed px-2 py-1.5 font-mono text-[9px] cursor-pointer text-center hover:opacity-70"
                        style={{ borderColor: border, color: muted }}
                      >
                        {uploadingEdit ? "UPLOADING..." : "📷 UPLOAD NEW"}
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f); }} disabled={uploadingEdit} />
                      </label>
                      {editForm.imageUrl && (
                        <button onClick={() => setEditForm(p => ({ ...p, imageUrl: "" }))} className="font-mono text-[8px] hover:text-red-400" style={{ color: muted }}>REMOVE</button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(post.id)} disabled={saving}
                      className="flex-1 py-1.5 font-mono text-[9px] tracking-wider disabled:opacity-50"
                      style={{ background: accent, color: accentFg }}
                    >
                      {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 font-mono text-[9px] border" style={{ borderColor: border, color: muted }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display Mode ── */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 flex gap-3">
                    {/* Thumbnail */}
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="w-12 h-12 object-cover border flex-shrink-0" style={{ borderColor: border }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`font-mono text-[9px] tracking-wider uppercase ${TYPE_COLORS[post.type] || ""}`}>{post.type}</span>
                        {post.pinned && <span className="font-mono text-[8px] px-1.5 py-0.5 bg-white/10 text-white">📌 PINNED</span>}
                        {post.featured && <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: `${accent}20`, color: accent }}>⭐ FEATURED</span>}
                        {isHidden && <span className="font-mono text-[8px] px-1.5 py-0.5 text-red-400 border border-red-400/30">HIDDEN</span>}
                      </div>
                      <h3 className="font-mono text-[11px] font-bold tracking-wider truncate" style={{ color: fg }}>{post.title}</h3>
                      <p className="font-mono text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: muted }}>{post.content}</p>
                      <div className="flex items-center gap-3 mt-2" style={{ color: muted }}>
                        <span className="font-mono text-[9px]">{post.author_name || "GASCLUB247"}</span>
                        <span className="font-mono text-[9px]">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(post)}
                      className="p-1.5 hover:opacity-70 transition-opacity"
                      style={{ color: muted }}
                      title="Edit post"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => handleToggleVisibility(post)}
                      className="p-1.5 hover:opacity-70 transition-opacity"
                      style={{ color: isHidden ? "rgb(239,68,68)" : muted }}
                      title={isHidden ? "Show on feed" : "Hide from feed"}
                    >
                      {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button onClick={() => handleTogglePin(post)}
                      className="p-1.5 hover:opacity-70 transition-opacity"
                      style={{ color: post.pinned ? accent : muted }}
                      title="Toggle pin"
                    >
                      <Pin size={12} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}
                      className="p-1.5 hover:text-red-400 transition-colors disabled:opacity-40"
                      style={{ color: muted }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOS PANEL — with inline editing
// ══════════════════════════════════════════════════════════════════════════════
function PromosPanel() {
  const { fg, border, muted, accent, accentFg } = useTheme();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", discountPct: "", oneTime: false, maxUses: "", expiresAt: "", minOrder: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ discountPct: "", maxUses: "", expiresAt: "", minOrder: "", oneTime: false });

  useEffect(() => { fetchPromoCodes().then(d => { setPromos(d); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.discountPct) { setError("Code and discount % required"); return; }
    setSaving(true); setError("");
    const result = await createPromoCode({
      code: form.code, discountPct: Number(form.discountPct), oneTime: form.oneTime,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
      minOrderAmount: form.minOrder ? Number(form.minOrder) : undefined,
    });
    if (result.success) {
      fetchPromoCodes().then(setPromos);
      setForm({ code: "", discountPct: "", oneTime: false, maxUses: "", expiresAt: "", minOrder: "" });
      setShowCreate(false);
    } else {
      setError(result.error || "Failed");
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await updatePromoCode(id, { active: !active });
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete promo code ${code}?`)) return;
    await deletePromoCode(id);
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  const startEdit = (promo: any) => {
    setEditingId(promo.id);
    setEditForm({
      discountPct: String(promo.discount_pct || ""),
      maxUses: promo.max_uses ? String(promo.max_uses) : "",
      expiresAt: promo.expires_at ? new Date(promo.expires_at).toISOString().split("T")[0] : "",
      minOrder: promo.min_order_amount ? String(promo.min_order_amount) : "",
      oneTime: promo.one_time || false,
    });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const updates: Record<string, any> = {};
    if (editForm.discountPct) updates.discount_pct = Number(editForm.discountPct);
    updates.max_uses = editForm.maxUses ? Number(editForm.maxUses) : null;
    updates.expires_at = editForm.expiresAt || null;
    updates.min_order_amount = editForm.minOrder ? Number(editForm.minOrder) : null;
    updates.one_time = editForm.oneTime;

    const result = await updatePromoCode(id, updates);
    if (result.success) {
      setPromos(prev => prev.map(p => p.id === id ? {
        ...p,
        discount_pct: updates.discount_pct ?? p.discount_pct,
        max_uses: updates.max_uses,
        expires_at: updates.expires_at,
        min_order_amount: updates.min_order_amount,
        one_time: updates.one_time,
      } : p));
      setEditingId(null);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>{loading ? "..." : `${promos.length} PROMO CODES`}</span>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider"
          style={{ background: accent, color: accentFg }}
        >
          <Plus size={12} /> NEW PROMO
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border overflow-hidden" style={{ borderColor: accent }}
          >
            <div className="p-4 space-y-3">
              <Label>NEW PROMO CODE</Label>
              <div className="grid grid-cols-2 gap-3">
                <AdminInput label="Code" value={form.code} onChange={v => setForm(p => ({ ...p, code: v.toUpperCase() }))} placeholder="e.g. SUMMER25" />
                <AdminInput label="Discount %" value={form.discountPct} onChange={v => setForm(p => ({ ...p, discountPct: v }))} placeholder="25" type="number" />
                <AdminInput label="Max Uses (optional)" value={form.maxUses} onChange={v => setForm(p => ({ ...p, maxUses: v }))} placeholder="100" type="number" />
                <AdminInput label="Min Order ($, optional)" value={form.minOrder} onChange={v => setForm(p => ({ ...p, minOrder: v }))} placeholder="50" type="number" />
                <AdminInput label="Expires At (optional)" value={form.expiresAt} onChange={v => setForm(p => ({ ...p, expiresAt: v }))} placeholder="2026-12-31" type="date" />
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" checked={form.oneTime} onChange={e => setForm(p => ({ ...p, oneTime: e.target.checked }))} className="w-3 h-3" />
                  <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>ONE-TIME USE PER USER</span>
                </div>
              </div>
              {error && <p className="font-mono text-[9px] text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-2 font-mono text-[10px] tracking-wider disabled:opacity-50"
                  style={{ background: accent, color: accentFg }}
                >
                  {saving ? "CREATING..." : "CREATE CODE"}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 font-mono text-[10px] border" style={{ borderColor: border, color: muted }}>CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border divide-y" style={{ borderColor: border }}>
        {loading ? <Loader /> : promos.length === 0 ? <Empty label="No promo codes" /> :
          promos.map(promo => (
            <div key={promo.id} className="p-3">
              {editingId === promo.id ? (
                /* ── Inline Edit Mode ── */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: fg }}>{promo.code}</span>
                    <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: `${accent}20`, color: accent }}>EDITING</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AdminInput label="Discount %" value={editForm.discountPct} onChange={v => setEditForm(p => ({ ...p, discountPct: v }))} type="number" />
                    <AdminInput label="Max Uses" value={editForm.maxUses} onChange={v => setEditForm(p => ({ ...p, maxUses: v }))} placeholder="∞" type="number" />
                    <AdminInput label="Min Order ($)" value={editForm.minOrder} onChange={v => setEditForm(p => ({ ...p, minOrder: v }))} placeholder="0" type="number" />
                    <AdminInput label="Expires" value={editForm.expiresAt} onChange={v => setEditForm(p => ({ ...p, expiresAt: v }))} type="date" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.oneTime} onChange={e => setEditForm(p => ({ ...p, oneTime: e.target.checked }))} className="w-3 h-3" />
                    <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>ONE-TIME USE PER USER</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(promo.id)} disabled={saving}
                      className="flex-1 py-1.5 font-mono text-[9px] tracking-wider disabled:opacity-50"
                      style={{ background: accent, color: accentFg }}
                    >
                      {saving ? "SAVING..." : "SAVE"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 font-mono text-[9px] border" style={{ borderColor: border, color: muted }}>CANCEL</button>
                  </div>
                </div>
              ) : (
                /* ── Display Mode ── */
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: fg }}>{promo.code}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: `${accent}20`, color: accent }}>
                        {promo.discount_pct}% OFF
                      </span>
                      {!promo.active && <span className="font-mono text-[8px] px-1.5 py-0.5 text-red-400 border border-red-400/30">INACTIVE</span>}
                    </div>
                    <div className="font-mono text-[9px] mt-0.5" style={{ color: muted }}>
                      {promo.one_time ? "One-time use" : "Multi-use"}
                      {promo.max_uses ? ` · Max ${promo.max_uses}` : ""}
                      {promo.usage_count > 0 ? ` · Used ${promo.usage_count}×` : ""}
                      {promo.min_order_amount ? ` · Min $${promo.min_order_amount}` : ""}
                      {promo.expires_at ? ` · Expires ${new Date(promo.expires_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => startEdit(promo)}
                      className="p-1.5 hover:opacity-70 transition-opacity"
                      style={{ color: muted }}
                      title="Edit promo"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => handleToggle(promo.id, promo.active)}
                      className="font-mono text-[9px] px-2 py-1 border transition-all"
                      style={{ borderColor: border, color: promo.active ? "rgb(34 197 94)" : muted }}
                    >
                      {promo.active ? "ACTIVE" : "DISABLED"}
                    </button>
                    <button onClick={() => handleDelete(promo.id, promo.code)} className="p-1.5 hover:text-red-400 transition-colors" style={{ color: muted }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function UsersPanel() {
  const { fg, border, muted, accent, accentFg } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchAllUsers().then(d => { setUsers(d); setLoading(false); }); }, []);

  const changeRole = async (userId: string, newRole: "member" | "approved_buyer" | "admin" | "super_admin") => {
    setUpdatingId(userId);
    await updateUserRole(userId, newRole);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setUpdatingId(null);
  };

  const ROLES: Array<"member" | "approved_buyer" | "admin" | "super_admin"> = ["member", "approved_buyer", "admin", "super_admin"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>{loading ? "..." : `${users.length} MEMBERS`}</span>
      </div>

      <div className="border divide-y" style={{ borderColor: border }}>
        {loading ? <Loader /> : users.length === 0 ? <Empty label="No users yet" /> :
          users.map(user => (
            <div key={user.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover grayscale" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: border, color: fg }}>
                      {(user.username || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="font-mono text-[11px] font-medium" style={{ color: fg }}>@{user.username}</span>
                    {user.display_name && user.display_name !== user.username && (
                      <p className="font-mono text-[9px]" style={{ color: muted }}>{user.display_name}</p>
                    )}
                    <p className="font-mono text-[9px]" style={{ color: muted }}>{user.email || "No email"}</p>
                  </div>
                </div>
                <span className={`font-mono text-[9px] tracking-wider px-2 py-0.5 ${ROLE_COLORS[user.role] || ""}`}>
                  {(user.role || "member").replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Role selector */}
              <div className="flex gap-1.5 flex-wrap pl-11">
                {ROLES.map(role => (
                  <button key={role} onClick={() => changeRole(user.id, role)} disabled={user.role === role || updatingId === user.id}
                    className="font-mono text-[8px] px-2 py-0.5 border transition-all disabled:opacity-40"
                    style={{
                      borderColor: user.role === role ? accent : border,
                      color: user.role === role ? accent : muted,
                      background: user.role === role ? `${accent}15` : "transparent",
                    }}
                  >
                    {role === "approved_buyer" ? "BUYER" : role.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  const { muted } = useTheme();
  return <span className="font-mono text-[9px] tracking-[0.2em] block mb-1.5" style={{ color: muted }}>{children}</span>;
}

function Loader() {
  const { muted } = useTheme();
  return <div className="p-6 text-center font-mono text-[10px]" style={{ color: muted }}>LOADING...</div>;
}

function Empty({ label }: { label: string }) {
  const { muted } = useTheme();
  return <div className="p-6 text-center font-mono text-[10px]" style={{ color: muted }}>{label.toUpperCase()}</div>;
}

function AdminInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const { fg, border, muted } = useTheme();
  return (
    <div>
      <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent border px-3 py-2 font-mono text-[10px] tracking-wider outline-none transition-colors"
        style={{ borderColor: border, color: fg }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATE PANEL — Post / Product upload toggle
// ══════════════════════════════════════════════════════════════════════════════
function CreatePanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { user } = useAuth();
  const [mode, setMode] = useState<"post" | "product">("post");

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center gap-1 p-1 border" style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        {(["post", "product"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 font-mono text-[9px] tracking-[0.2em] transition-all"
            style={{
              background: mode === m ? accent : "transparent",
              color: mode === m ? accentFg : muted,
            }}
          >
            {m === "post" ? "📝 CREATE POST" : "📦 ADD PRODUCT"}
          </button>
        ))}
      </div>

      {mode === "post" ? (
        <CreatePostForm user={user} />
      ) : (
        <CreateProductForm />
      )}
    </div>
  );
}

function CreatePostForm({ user }: { user: any }) {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const [form, setForm] = useState({ type: "drop" as "drop"|"update"|"media"|"review"|"promo", title: "", content: "", pinned: false, featured: false, imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const POST_TYPES: Array<"drop"|"update"|"media"|"review"|"promo"> = ["drop", "update", "media", "review", "promo"];
  const TYPE_COLORS: Record<string, string> = { drop: "text-purple-400", update: "text-blue-400", media: "text-green-400", review: "text-yellow-400", promo: "text-orange-400" };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gasclub247/posts");
      const res = await fetch("/api/upload", { method: "POST", body: formData, headers: adminUploadHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Upload failed (${res.status})`);
      } else {
        setForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
      }
    } catch (err: any) { setError(err?.message || "Upload failed"); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) { setError("Title and content are required."); return; }
    setSaving(true); setError("");
    const token = getAdminToken();
    const result = await createPostAction(token, {
      type: form.type, title: form.title, content: form.content,
      authorId: user?.id, authorName: user?.displayName || "GASCLUB247",
      imageUrl: form.imageUrl || undefined, pinned: form.pinned, featured: form.featured,
    });
    if (result.success) {
      setSaved(true);
      setForm({ type: "drop", title: "", content: "", pinned: false, featured: false, imageUrl: "" });
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || "Failed to create post.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Label>POST TYPE</Label>
      <div className="flex gap-2 flex-wrap mb-3">
        {POST_TYPES.map(t => (
          <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
            className={`font-mono text-[9px] px-2.5 py-1 border transition-all ${TYPE_COLORS[t] || ""}`}
            style={{ borderColor: form.type === t ? accent : border, background: form.type === t ? `${accent}15` : "transparent" }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <AdminInput label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Post headline..." />

      <div>
        <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>CONTENT</span>
        <textarea
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="Write your post content..."
          rows={5}
          className="w-full bg-transparent border px-3 py-2.5 font-mono text-[10px] tracking-wider outline-none resize-none leading-relaxed"
          style={{ borderColor: border, color: fg }}
        />
      </div>

      {/* Image Upload Area */}
      <div>
        <span className="font-mono text-[9px] tracking-wider block mb-1.5" style={{ color: muted }}>IMAGE (OPTIONAL)</span>
        <label className="flex flex-col items-center justify-center border-2 border-dashed py-8 px-6 cursor-pointer transition-all hover:opacity-70"
          style={{ borderColor: form.imageUrl ? accent : border, background: form.imageUrl ? `${accent}08` : "transparent" }}
        >
          {uploading ? (
            <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>UPLOADING...</span>
          ) : form.imageUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover border" style={{ borderColor: border }} />
              <span className="font-mono text-[8px] tracking-wider" style={{ color: accent }}>IMAGE READY ✓</span>
            </div>
          ) : (
            <div className="text-center space-y-1.5">
              <ImageIcon size={24} style={{ color: muted, margin: "0 auto" }} />
              <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>DRAG & DROP OR CLICK TO UPLOAD</span>
              <span className="font-mono text-[8px]" style={{ color: muted }}>JPG, PNG, WEBP — Max 10 MB</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={uploading} />
        </label>
        {form.imageUrl && (
          <button className="mt-1 font-mono text-[8px] tracking-wider hover:opacity-70" style={{ color: muted }}
            onClick={() => setForm(p => ({ ...p, imageUrl: "" }))}
          >
            REMOVE IMAGE
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="w-3 h-3" />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>PIN POST</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-3 h-3" />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>FEATURE</span>
        </label>
      </div>

      {error && <p className="font-mono text-[9px] text-red-400">{error}</p>}
      {saved && <p className="font-mono text-[9px] text-green-400">POST PUBLISHED ✓</p>}

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={saving || !form.title || !form.content}
          className="flex-1 py-3 font-mono text-[10px] tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ background: accent, color: accentFg }}
        >
          {saving ? "PUBLISHING..." : "PUBLISH POST"}
        </button>
      </div>
    </div>
  );
}

function CreateProductForm() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const [form, setForm] = useState({ sku: "", name: "", category: "featured", price: "", stock: "", description: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const categories = ["featured", "exotic", "candy", "gas", "premium", "prerolls", "smalls"];

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `gasclub247/products/${form.category}`);
      const res = await fetch("/api/upload", { method: "POST", body: formData, headers: adminUploadHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Upload failed (${res.status})`);
      } else {
        setForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
      }
    } catch (err: any) { setError(err?.message || "Upload failed"); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.sku || !form.name || !form.price) { setError("SKU, Name, and Price are required."); return; }
    setSaving(true); setError("");
    const token = getAdminToken();
    const result = await createProductAction(token, {
      sku: form.sku, name: form.name, category: form.category,
      price: Number(form.price), stock: Number(form.stock) || 0,
      description: form.description, imageUrl: form.imageUrl || undefined,
    });
    if (result.success) {
      setSaved(true);
      setForm({ sku: "", name: "", category: "featured", price: "", stock: "", description: "", imageUrl: "" });
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || "Failed to add product.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AdminInput label="SKU" value={form.sku} onChange={v => setForm(p => ({ ...p, sku: v }))} placeholder="TC-PLMC-01" />
        <AdminInput label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="PLATINUM LEMON CHERRY" />
        <AdminInput label="PRICE ($)" value={form.price} onChange={v => setForm(p => ({ ...p, price: v }))} placeholder="120" type="number" />
        <AdminInput label="STOCK (UNITS)" value={form.stock} onChange={v => setForm(p => ({ ...p, stock: v }))} placeholder="50" type="number" />
      </div>

      <div>
        <span className="font-mono text-[9px] tracking-wider block mb-1.5" style={{ color: muted }}>CATEGORY</span>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
              className="font-mono text-[9px] px-2.5 py-1 border transition-all"
              style={{ borderColor: form.category === c ? accent : border, color: form.category === c ? accent : muted, background: form.category === c ? `${accent}15` : "transparent" }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>DESCRIPTION</span>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Product details, effects, genetics..."
          rows={3}
          className="w-full bg-transparent border px-3 py-2.5 font-mono text-[10px] tracking-wider outline-none resize-none"
          style={{ borderColor: border, color: fg }}
        />
      </div>

      {/* Image Upload */}
      <div>
        <span className="font-mono text-[9px] tracking-wider block mb-1.5" style={{ color: muted }}>PRODUCT PHOTO</span>
        <label className="flex flex-col items-center justify-center border-2 border-dashed py-8 px-6 cursor-pointer transition-all hover:opacity-70"
          style={{ borderColor: form.imageUrl ? accent : border, background: form.imageUrl ? `${accent}08` : "transparent" }}
        >
          {uploading ? (
            <span className="font-mono text-[9px]" style={{ color: muted }}>UPLOADING...</span>
          ) : form.imageUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover border" style={{ borderColor: border }} />
              <span className="font-mono text-[8px] tracking-wider" style={{ color: accent }}>PHOTO READY ✓</span>
            </div>
          ) : (
            <div className="text-center space-y-1.5">
              <ImageIcon size={24} style={{ color: muted, margin: "0 auto" }} />
              <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>CLICK TO UPLOAD PRODUCT PHOTO</span>
              <span className="font-mono text-[8px]" style={{ color: muted }}>JPG, PNG, WEBP — Max 10 MB</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={uploading} />
        </label>
      </div>

      {error && <p className="font-mono text-[9px] text-red-400">{error}</p>}
      {saved && <p className="font-mono text-[9px] text-green-400">PRODUCT ADDED ✓</p>}

      <button onClick={handleSubmit} disabled={saving}
        className="w-full py-3 font-mono text-[10px] tracking-wider disabled:opacity-50 transition-all active:scale-[0.98]"
        style={{ background: accent, color: accentFg }}
      >
        {saving ? "ADDING..." : "ADD PRODUCT"}
      </button>
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL — enhanced with actionable controls
// ══════════════════════════════════════════════════════════════════════════════
function SettingsPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();

  const [orders, setOrders] = useState<any[]>([]);

  const [exportingOrders, setExportingOrders] = useState(false);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);

  useEffect(() => {

    fetch("/api/orders", { headers: adminHeaders() })
      .then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {});
    fetchProducts().then(setProducts);
  }, []);



  const exportOrdersCSV = () => {
    setExportingOrders(true);
    const header = "Order#,Customer,Email,Total,Status,Payment,Items,Date\n";
    const rows = orders.map(o =>
      `"${o.order_number || o.id}","${o.user_name || "Guest"}","${o.user_email || ""}","$${Number(o.total || 0).toFixed(2)}","${o.status || "pending"}","${o.payment_method || ""}","${Array.isArray(o.items) ? o.items.length : 0} items","${new Date(o.created_at).toLocaleDateString()}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `gasclub247_orders_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportingOrders(false);
  };

  const hiddenCount = products.filter(p => p.tags?.includes("hidden")).length;
  const featuredCount = products.filter(p => p.featured).length;
  const lowStockCount = products.filter(p => p.status === "low-stock").length;
  const soldOutCount = products.filter(p => p.status === "sold-out").length;
  const inStockCount = products.filter(p => p.status === "in-stock").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Store Health ── */}
      <div>
        <Label>STORE HEALTH</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {[
            { label: "IN STOCK", value: inStockCount, color: "rgb(34,197,94)" },
            { label: "LOW STOCK", value: lowStockCount, color: "rgb(234,179,8)" },
            { label: "SOLD OUT", value: soldOutCount, color: "rgb(239,68,68)" },
            { label: "HIDDEN", value: hiddenCount, color: muted },
          ].map(s => (
            <div key={s.label} className="border p-3 text-center" style={{ borderColor: border }}>
              <span className="font-mono text-lg font-bold block" style={{ color: s.color }}>{s.value}</span>
              <span className="font-mono text-[8px] tracking-[0.15em]" style={{ color: muted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Overview ── */}
      <div>
        <Label>PLATFORM OVERVIEW</Label>
        <div className="border divide-y" style={{ borderColor: border }}>
          {[
            { label: "TOTAL PRODUCTS", value: String(products.length), badge: null },
            { label: "FEATURED PRODUCTS", value: String(featuredCount), badge: null },
            { label: "TOTAL ORDERS", value: String(orders.length), badge: orders.length > 0 ? "LIVE" : null },
            { label: "PENDING ORDERS", value: String(pendingOrders), badge: pendingOrders > 0 ? "ACTION" : null },
            { label: "TOTAL REVENUE", value: `$${totalRevenue.toFixed(2)}`, badge: null },
            { label: "COMPLETED ORDERS", value: String(completedOrders), badge: null },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: muted }}>{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold" style={{ color: fg }}>{item.value}</span>
                {item.badge && (
                  <span className="font-mono text-[7px] tracking-wider px-1.5 py-0.5" style={{
                    background: item.badge === "ACTION" ? "rgba(234,179,8,0.15)" : `${accent}15`,
                    color: item.badge === "ACTION" ? "rgb(234,179,8)" : accent,
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Site Configuration ── */}
      <div>
        <Label>SITE CONFIGURATION</Label>
        <div className="border divide-y" style={{ borderColor: border }}>
          {[
            { label: "WELCOME PROMO", value: "WELCOME247 (20% off)" },
            { label: "ORDER CONTACT", value: "+1 (310) 994-0642" },
            { label: "PAYMENT METHODS", value: "Zelle, Crypto" },
            { label: "SITE ACCESS", value: "Public (no code required)" },
            { label: "TELEGRAM ALERTS", value: "Enabled (order notifications)" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: muted }}>{item.label}</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: fg }}>{item.value}</span>
            </div>
          ))}
        </div>
        <p className="font-mono text-[8px] tracking-wider mt-2" style={{ color: muted }}>
          ↑ These values are configured via environment variables. Edit in Vercel Dashboard → Settings → Environment Variables.
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <Label>QUICK ACTIONS</Label>
        <button
          onClick={() => { window.location.reload(); }}
          className="w-full py-3 font-mono text-[10px] tracking-wider border transition-all active:scale-95 mt-2 flex items-center justify-center gap-2"
          style={{ borderColor: accent, color: accent }}
        >
          🔄 REFRESH ALL DATA
        </button>
      </div>

      {/* ── Data Export ── */}
      <div>
        <Label>DATA EXPORT</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={exportOrdersCSV}
            disabled={exportingOrders || orders.length === 0}
            className="py-3 font-mono text-[10px] tracking-wider border transition-all active:scale-95 disabled:opacity-40"
            style={{ borderColor: accent, color: accent }}
          >
            {exportingOrders ? "EXPORTING..." : `📦 ${orders.length} ORDERS`}
          </button>
          <button
            onClick={() => {
              const header = "ID,SKU,Name,Category,Price,Stock,Status,Featured\n";
              const rows = products.map(p =>
                `"${p.id}","${p.sku}","${p.name}","${p.category}",${p.price},${p.stock},"${p.status}",${p.featured}`
              ).join("\n");
              const blob = new Blob([header + rows], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `gasclub247_products_${Date.now()}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={products.length === 0}
            className="py-3 font-mono text-[10px] tracking-wider border transition-all active:scale-95 disabled:opacity-40"
            style={{ borderColor: accent, color: accent }}
          >
            🏷️ {products.length} PRODUCTS
          </button>
        </div>
      </div>

      {/* ── System Info ── */}
      <div>
        <Label>SYSTEM INFO</Label>
        <div className="border divide-y" style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
          {[
            { label: "FRAMEWORK", value: "Next.js 16 (Turbopack)" },
            { label: "DATABASE", value: "Supabase (PostgreSQL)" },
            { label: "MEDIA CDN", value: "Cloudinary" },
            { label: "DEPLOYMENT", value: "Vercel" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: muted }}>{item.label}</span>
              <span className="font-mono text-[9px] font-bold" style={{ color: fg }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Session & Security ── */}
      <div>
        <Label>SESSION & SECURITY</Label>
        <div className="border p-4 space-y-3" style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: getAdminToken() ? "rgb(34,197,94)" : "rgb(239,68,68)" }} />
            <span className="font-mono text-[10px] font-bold" style={{ color: fg }}>
              {getAdminToken() ? "AUTHENTICATED" : "NO SESSION"}
            </span>
          </div>
          <p className="font-mono text-[9px] leading-relaxed" style={{ color: muted }}>
            {getAdminToken()
              ? "JWT session active. Admin token stored for this tab only. Closing the tab requires re-authentication. Rotate your admin passkey regularly via environment variables."
              : "No admin session token detected. Re-authenticate via the admin passkey to regain access to protected API endpoints."
            }
          </p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem("gc247_session"); sessionStorage.removeItem("gc247_admin"); localStorage.removeItem("gc247_admin"); localStorage.removeItem("gc247_session"); window.location.href = "/"; }}
          className="w-full mt-3 py-3 font-mono text-[10px] tracking-wider border transition-all active:scale-95"
          style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgb(239,68,68)" }}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}

