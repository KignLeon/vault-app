"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
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
  UserCheck, UserX, AlertCircle,
} from "lucide-react";
import { fetchProducts, updateProduct } from "@/lib/products";
import type { NormalizedProduct } from "@/lib/products";
import {
  fetchPosts, createPost, updatePost, deletePost,
  fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  fetchAllUsers, updateUserRole, createProduct, deleteProduct,
  type DbPost,
} from "@/lib/community";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab = "overview" | "orders" | "inventory" | "community" | "promos" | "users" | "create" | "leads";

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

// ── Admin Shell ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const { fg, border, isDark, muted, accent, accentFg } = useTheme();
  const { user, isAdmin } = useAuth();

  const tabs: { id: AdminTab; label: string; icon: typeof Package }[] = [
    { id: "overview",   label: "OVERVIEW",   icon: TrendingUp },
    { id: "orders",     label: "ORDERS",     icon: ShoppingCart },
    { id: "inventory",  label: "INVENTORY",  icon: Package },
    { id: "community",  label: "COMMUNITY",  icon: FileText },
    { id: "promos",     label: "PROMOS",     icon: Ticket },
    { id: "users",      label: "USERS",      icon: Users },
    { id: "create",     label: "CREATE",     icon: Plus },
    { id: "leads",      label: "LEADS",      icon: UserCheck },
  ];

  if (user && !isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle size={32} style={{ color: muted }} />
          <p className="font-mono text-xs tracking-[0.2em]" style={{ color: muted }}>ACCESS DENIED</p>
        </div>
      </AppShell>
    );
  }

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
          {activeTab === "promos"     && <PromosPanel />}
          {activeTab === "users"      && <UsersPanel />}
          {activeTab === "create"     && <CreatePanel />}
          {activeTab === "leads"      && <LeadsPanel />}
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
    const token = session?.access_token;
    Promise.all([
      fetch("/api/orders?limit=100", token ? { headers: { Authorization: `Bearer ${token}` } } : {})
        .then(r => r.json()).then(d => d.orders || []),
      fetchProducts(),
      fetchAllUsers(),
    ]).then(([orderData, productData, userData]) => {
      setOrders(orderData);
      setProducts(productData);
      setUsers(userData);
      setLoading(false);
    });
  }, [session]);

  const revenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const completedRevenue = orders
    .filter(o => o.status === "completed" || o.status === "paid")
    .reduce((s, o) => s + Number(o.total), 0);

  // Simulated online count — uses stable hash of current minute
  const onlineCount = Math.floor(3 + (Math.abs(Math.sin(new Date().getMinutes())) * 7));

  const stats = [
    { label: "PRODUCTS",       value: products.length,                                  icon: Package,      color: "" },
    { label: "PENDING ORDERS", value: orders.filter(o => o.status === "pending").length, icon: ShoppingCart, color: "text-yellow-400" },
    { label: "MEMBERS",        value: users.length,                                     icon: Users,        color: "" },
    { label: "TOTAL REVENUE",  value: `$${revenue.toLocaleString()}`,                   icon: DollarSign,   color: "text-green-400" },
    { label: "COMPLETED REV.", value: `$${completedRevenue.toLocaleString()}`,           icon: Activity,     color: "text-green-400" },
    { label: "EST. ACTIVE",    value: onlineCount,                                      icon: BarChart2,    color: "text-blue-400" },
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
    const token = session?.access_token;
    fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); });
  }, [statusFilter, session]);

  useEffect(() => { load(); }, [load]);

  const patchOrder = async (orderId: string, body: object) => {
    setUpdatingId(orderId);
    await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, ...body }) });
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
// INVENTORY PANEL
// ══════════════════════════════════════════════════════════════════════════════
function InventoryPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState({ price: "", stock: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ sku: "", name: "", category: "featured", price: "", stock: "", description: "", imageUrl: "" });
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = ["featured", "exotic", "candy", "gas", "premium", "prerolls", "smalls"];

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `gasclub247/products/${addForm.category}`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.optimizedUrl) {
        setAddForm(p => ({ ...p, imageUrl: data.optimizedUrl }));
      } else if (data.url) {
        setAddForm(p => ({ ...p, imageUrl: data.url }));
      } else {
        setAddError(data.error || "Upload failed");
      }
    } catch {
      setAddError("Image upload failed");
    }
    setUploading(false);
  };

  useEffect(() => { fetchProducts().then(d => { setProducts(d); setLoading(false); }); }, []);

  const startEdit = (p: NormalizedProduct) => {
    setEditingId(p.id);
    setEditVals({ price: String(p.price), stock: String(p.stock), name: p.name });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const newStock = Number(editVals.stock);
    const newStatus = newStock === 0 ? "sold-out" : newStock <= 10 ? "low-stock" : "in-stock";
    await updateProduct(id, { price: Number(editVals.price), stock: newStock, status: newStatus });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price: Number(editVals.price), stock: newStock, status: newStatus as any } : p));
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const handleAdd = async () => {
    if (!addForm.sku || !addForm.name || !addForm.price) { setAddError("SKU, Name, and Price are required."); return; }
    setAddError(""); setSaving(true);
    const result = await createProduct({
      sku: addForm.sku, name: addForm.name, category: addForm.category,
      price: Number(addForm.price), stock: Number(addForm.stock) || 0,
      description: addForm.description, imageUrl: addForm.imageUrl || undefined,
    });
    if (result.success) {
      setShowAdd(false);
      setAddForm({ sku: "", name: "", category: "indoors", price: "", stock: "", description: "", imageUrl: "" });
      fetchProducts().then(setProducts);
    } else {
      setAddError(result.error || "Failed to add product");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
          {loading ? "..." : `${products.length} PRODUCTS`}
        </span>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider transition-all"
          style={{ background: accent, color: accentFg }}
        >
          <Plus size={12} /> ADD PRODUCT
        </button>
      </div>

      {/* Add product form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border overflow-hidden" style={{ borderColor: accent }}
          >
            <div className="p-4 space-y-3">
              <Label>NEW PRODUCT</Label>
              <div className="grid grid-cols-2 gap-3">
                <AdminInput label="SKU" value={addForm.sku} onChange={v => setAddForm(p => ({ ...p, sku: v }))} placeholder="e.g. TC-PLMC-01" />
                <AdminInput label="Name" value={addForm.name} onChange={v => setAddForm(p => ({ ...p, name: v }))} placeholder="e.g. PLATINUM LEMON CHERRY" />
                <AdminInput label="Price ($)" value={addForm.price} onChange={v => setAddForm(p => ({ ...p, price: v }))} placeholder="120" type="number" />
                <AdminInput label="Stock" value={addForm.stock} onChange={v => setAddForm(p => ({ ...p, stock: v }))} placeholder="50" type="number" />
              </div>
              <div>
                <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>CATEGORY</span>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(c => (
                    <button key={c} onClick={() => setAddForm(p => ({ ...p, category: c }))}
                      className="font-mono text-[9px] px-2 py-1 border transition-all"
                      style={{ borderColor: addForm.category === c ? accent : border, color: addForm.category === c ? accent : muted, background: addForm.category === c ? `${accent}15` : "transparent" }}
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <AdminInput label="Description" value={addForm.description} onChange={v => setAddForm(p => ({ ...p, description: v }))} placeholder="Strain description…" />
              {/* Image upload */}
              <div>
                <span className="font-mono text-[9px] tracking-wider block mb-1" style={{ color: muted }}>PRODUCT IMAGE</span>
                <div className="flex gap-2">
                  <label
                    className="flex-1 border border-dashed px-3 py-2 font-mono text-[10px] tracking-wider cursor-pointer text-center transition-all hover:opacity-70"
                    style={{ borderColor: border, color: muted }}
                  >
                    {uploading ? "UPLOADING..." : addForm.imageUrl ? "✅ IMAGE UPLOADED" : "📷 CLICK TO UPLOAD"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={uploading} />
                  </label>
                </div>
                {addForm.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={addForm.imageUrl} alt="Preview" className="w-12 h-12 object-cover border" style={{ borderColor: border }} />
                    <input value={addForm.imageUrl} onChange={e => setAddForm(p => ({ ...p, imageUrl: e.target.value }))} className="flex-1 bg-transparent border px-2 py-1 font-mono text-[9px] outline-none" style={{ borderColor: border, color: muted }} />
                  </div>
                )}
              </div>
              {addError && <p className="font-mono text-[9px] text-red-400">{addError}</p>}
              <div className="flex gap-3">
                <button onClick={handleAdd} disabled={saving}
                  className="flex-1 py-2 font-mono text-[10px] tracking-wider transition-all disabled:opacity-50"
                  style={{ background: accent, color: accentFg }}
                >
                  {saving ? "SAVING..." : "ADD PRODUCT"}
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="px-4 py-2 font-mono text-[10px] border transition-all"
                  style={{ borderColor: border, color: muted }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products table */}
      <div className="border divide-y" style={{ borderColor: border }}>
        <div className="grid grid-cols-8 gap-2 px-3 py-2 font-mono text-[9px] tracking-[0.15em]" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", color: muted }}>
          <span className="col-span-2">NAME</span>
          <span className="col-span-1">CAT</span>
          <span>PRICE</span>
          <span>STOCK</span>
          <span>STATUS</span>
          <span className="col-span-2">ACTIONS</span>
        </div>

        {loading ? <Loader /> : products.map(p => (
          <div key={p.id} className="grid grid-cols-8 gap-2 px-3 py-3 items-center">
            <span className="col-span-2 font-mono text-[10px] font-medium truncate" style={{ color: fg }}>
              {editingId === p.id
                ? <input value={editVals.name} onChange={e => setEditVals(p2 => ({ ...p2, name: e.target.value }))} className="w-full bg-transparent border-b font-mono text-[10px] outline-none" style={{ borderColor: muted, color: fg }} />
                : p.name}
            </span>
            <span className="col-span-1 font-mono text-[9px] uppercase truncate" style={{ color: muted }}>{p.category}</span>

            {editingId === p.id ? (
              <>
                <input value={editVals.price} onChange={e => setEditVals(p2 => ({ ...p2, price: e.target.value }))} className="bg-transparent border px-1 py-0.5 font-mono text-[10px] outline-none w-16" style={{ borderColor: muted, color: fg }} />
                <input value={editVals.stock} onChange={e => setEditVals(p2 => ({ ...p2, stock: e.target.value }))} className="bg-transparent border px-1 py-0.5 font-mono text-[10px] outline-none w-14" style={{ borderColor: muted, color: fg }} />
                <span className="font-mono text-[9px]" style={{ color: muted }}>—</span>
                <div className="col-span-2 flex gap-1">
                  <button onClick={() => saveEdit(p.id)} disabled={saving} className="p-1.5 border" style={{ borderColor: accent, color: accent }}><Check size={11} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 border" style={{ borderColor: border, color: muted }}><X size={11} /></button>
                </div>
              </>
            ) : (
              <>
                <span className="font-mono text-[10px]" style={{ color: fg }}>${p.price}</span>
                <span className="font-mono text-[10px]" style={{ color: fg }}>{p.stock}</span>
                <StockBadge status={p.status} />
                <div className="col-span-2 flex gap-1">
                  <button onClick={() => startEdit(p)} className="p-1.5 hover:opacity-60 transition-opacity" style={{ color: muted }}><Edit3 size={12} /></button>
                  <button onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id} className="p-1.5 hover:text-red-400 transition-colors disabled:opacity-40" style={{ color: muted }}><Trash2 size={12} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNITY PANEL
// ══════════════════════════════════════════════════════════════════════════════
function CommunityPanel() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "update" as DbPost["type"], title: "", content: "", pinned: false, featured: false, imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchPosts().then(d => { setPosts(d); setLoading(false); }); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const result = await createPost({
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
    await deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDeletingId(null);
  };

  const handleTogglePin = async (post: DbPost) => {
    await updatePost(post.id, { pinned: !post.pinned });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p));
  };

  const POST_TYPES: DbPost["type"][] = ["announcement", "drop", "update", "media", "review", "promo"];
  const TYPE_COLORS: Record<string, string> = { announcement: "text-red-400", drop: "text-purple-400", update: "text-blue-400", media: "text-green-400", review: "text-yellow-400", promo: "text-orange-400" };

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
          <Plus size={12} /> NEW POST
        </button>
      </div>

      {/* Create post form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border overflow-hidden" style={{ borderColor: accent }}
          >
            <div className="p-4 space-y-3">
              <Label>NEW POST</Label>

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
              <AdminInput label="Image URL (optional)" value={form.imageUrl} onChange={v => setForm(p => ({ ...p, imageUrl: v }))} placeholder="https://..." />

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
          posts.map(post => (
            <div key={post.id} className="border p-4" style={{ borderColor: border, background: post.pinned ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)") : "transparent" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono text-[9px] tracking-wider uppercase ${TYPE_COLORS[post.type] || ""}`}>{post.type}</span>
                    {post.pinned && <span className="font-mono text-[8px] px-1.5 py-0.5 bg-white/10 text-white">📌 PINNED</span>}
                    {post.featured && <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: `${accent}20`, color: accent }}>⭐ FEATURED</span>}
                  </div>
                  <h3 className="font-mono text-[11px] font-bold tracking-wider truncate" style={{ color: fg }}>{post.title}</h3>
                  <p className="font-mono text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: muted }}>{post.content}</p>
                  <div className="flex items-center gap-3 mt-2" style={{ color: muted }}>
                    <span className="font-mono text-[9px]">{post.author_name || "GASCLUB247"}</span>
                    <span className="font-mono text-[9px]">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-start gap-1 flex-shrink-0">
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
            </div>
          ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function PromosPanel() {
  const { fg, border, muted, accent, accentFg } = useTheme();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", discountPct: "", oneTime: false, maxUses: "", expiresAt: "", minOrder: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
            <div key={promo.id} className="flex items-center justify-between p-3">
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
                  {promo.expires_at ? ` · Expires ${new Date(promo.expires_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
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
  const [form, setForm] = useState({ type: "update" as "announcement"|"drop"|"update"|"media"|"review"|"promo", title: "", content: "", pinned: false, featured: false, imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const POST_TYPES: Array<"announcement"|"drop"|"update"|"media"|"review"|"promo"> = ["announcement", "drop", "update", "media", "review", "promo"];
  const TYPE_COLORS: Record<string, string> = { announcement: "text-red-400", drop: "text-purple-400", update: "text-blue-400", media: "text-green-400", review: "text-yellow-400", promo: "text-orange-400" };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gasclub247/posts");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
    } catch { setError("Upload failed"); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) { setError("Title and content are required."); return; }
    setSaving(true); setError("");
    const result = await createPost({
      type: form.type, title: form.title, content: form.content,
      authorId: user?.id, authorName: user?.displayName || "GASCLUB247",
      imageUrl: form.imageUrl || undefined, pinned: form.pinned, featured: form.featured,
    });
    if (result.success) {
      setSaved(true);
      setForm({ type: "update", title: "", content: "", pinned: false, featured: false, imageUrl: "" });
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `gasclub247/products/${form.category}`);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setForm(p => ({ ...p, imageUrl: data.optimizedUrl || data.url || "" }));
    } catch { setError("Upload failed"); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.sku || !form.name || !form.price) { setError("SKU, Name, and Price are required."); return; }
    setSaving(true); setError("");
    const result = await createProduct({
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
// LEADS PANEL
// ══════════════════════════════════════════════════════════════════════════════
function LeadsPanel() {
  const { fg, border, muted, accent } = useTheme();
  const { session } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = session?.access_token;
    fetch("/api/leads", token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setLoading(false); });
  }, [session]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
          {loading ? "..." : `${leads.length} LEADS`}
        </span>
      </div>
      <div className="border divide-y" style={{ borderColor: border }}>
        {loading ? <Loader /> : leads.length === 0 ? <Empty label="No leads yet" /> :
          leads.map((lead, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div>
                <p className="font-mono text-[10px] font-bold" style={{ color: fg }}>{lead.email || "—"}</p>
                <p className="font-mono text-[9px]" style={{ color: muted }}>{lead.phone || "no phone"} · {new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
              <span className="font-mono text-[8px] tracking-wider px-2 py-0.5" style={{ background: `${accent}15`, color: accent }}>
                {(lead.promo_offered || "WELCOME247")}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
