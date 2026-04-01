"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { members, posts as mockPosts } from "@/lib/data";
import { StockBadge } from "@/components/ui/stock-badge";
import { useTheme } from "@/lib/theme";
import { useProducts } from "@/hooks/use-products";
import { supabase } from "@/lib/supabase";
import {
  Package,
  Users,
  ShoppingCart,
  FileText,
  Upload,
  TrendingUp,
  Edit3,
  Eye,
  MoreHorizontal,
} from "lucide-react";

type AdminTab = "overview" | "inventory" | "posts" | "members" | "media";

const adminTabs: { id: AdminTab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "OVERVIEW", icon: TrendingUp },
  { id: "inventory", label: "INVENTORY", icon: Package },
  { id: "posts", label: "POSTS", icon: FileText },
  { id: "members", label: "MEMBERS", icon: Users },
  { id: "media", label: "MEDIA", icon: Upload },
];

function useAdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setOrders(data);
    });
  }, []);
  return orders;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const { fg, border, isDark, muted, cardBg, accent, accentFg } = useTheme();

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-6 pb-4 mb-6"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: muted }}>
          ADMIN
        </h1>
      </motion.div>

      {/* Admin Tabs */}
      <div className="flex overflow-x-auto no-scroll-bar gap-1 mb-8 pb-px" style={{ borderBottom: `1px solid ${border}` }}>
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-[0.15em] whitespace-nowrap transition-all border-b-2 -mb-px`}
              style={{
                color: activeTab === tab.id ? accent : muted,
                borderBottomColor: activeTab === tab.id ? accent : 'transparent',
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && <OverviewPanel />}
        {activeTab === "inventory" && <InventoryPanel />}
        {activeTab === "posts" && <PostsPanel />}
        {activeTab === "members" && <MembersPanel />}
        {activeTab === "media" && <MediaPanel />}
      </motion.div>
    </AppShell>
  );
}

// ---- OVERVIEW ----
function OverviewPanel() {
  const { products } = useProducts();
  const orders = useAdminOrders();

  const stats = [
    { label: "TOTAL PRODUCTS", value: products.length, icon: Package },
    { label: "ACTIVE MEMBERS", value: members.filter((m) => m.status === "active").length, icon: Users },
    { label: "PENDING ORDERS", value: orders.filter((o) => o.status === "pending").length, icon: ShoppingCart },
    { label: "TOTAL REVENUE", value: `$${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="border border-neutral-200 p-4">
              <Icon size={14} className="text-neutral-400 mb-2" />
              <div className="font-mono text-lg font-bold">{stat.value}</div>
              <div className="font-mono text-[9px] tracking-[0.15em] text-neutral-400 mt-0.5">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div>
        <h3 className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-3">
          RECENT ORDERS (LIVE DB)
        </h3>
        <div className="border border-neutral-200 divide-y divide-neutral-100">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3">
              <div>
                <span className="font-mono text-[11px] font-medium">{order.display_id || order.id.slice(0, 8)}</span>
                <span className="font-mono text-[10px] text-neutral-400 ml-2">
                  {order.items?.map((i: any) => i.product?.name).join(", ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-medium">${order.total}</span>
                <span
                  className={`font-mono text-[9px] tracking-wider px-2 py-0.5 ${
                    order.status === "pending"
                      ? "bg-neutral-100 text-neutral-600"
                      : order.status === "confirmed"
                      ? "bg-neutral-900 text-white"
                      : order.status === "shipped"
                      ? "bg-neutral-200 text-neutral-700"
                      : "bg-neutral-50 text-neutral-400"
                  }`}
                >
                  {(order.status || "pending").toUpperCase()}
                </span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-4 text-center text-neutral-400 font-mono text-xs">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- INVENTORY PANEL ----
function InventoryPanel() {
  const { products } = useProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
          {products.length} PRODUCTS
        </span>
        <button className="font-mono text-[10px] tracking-[0.15em] bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
          + ADD PRODUCT
        </button>
      </div>

      <div className="border border-neutral-200 divide-y divide-neutral-100 overflow-x-auto">
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 p-3 bg-neutral-50 font-mono text-[9px] tracking-[0.15em] text-neutral-500">
          <span>SKU</span>
          <span className="col-span-2">NAME</span>
          <span>PRICE</span>
          <span>STOCK</span>
          <span>ACTIONS</span>
        </div>

        {/* Rows */}
        {products.map((p) => (
          <div key={p.id} className="grid grid-cols-6 gap-2 p-3 items-center">
            <span className="font-mono text-[11px] font-medium">{p.sku}</span>
            <span className="font-mono text-[11px] text-neutral-600 col-span-2 truncate">
              {p.name}
            </span>
            <span className="font-mono text-[11px]">${p.price}</span>
            <StockBadge status={p.status} />
            <div className="flex gap-1">
              <button className="p-1 hover:bg-neutral-100 transition-colors">
                <Edit3 size={12} className="text-neutral-400" />
              </button>
              <button className="p-1 hover:bg-neutral-100 transition-colors">
                <Eye size={12} className="text-neutral-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- POSTS PANEL ----
function PostsPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
          {mockPosts.length} POSTS
        </span>
        <button className="font-mono text-[10px] tracking-[0.15em] bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
          + NEW POST
        </button>
      </div>

      <div className="space-y-2">
        {mockPosts.map((post) => (
          <div
            key={post.id}
            className="border border-neutral-200 p-4 flex items-start justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] tracking-wider text-neutral-400 uppercase">
                  {post.type}
                </span>
                {post.pinned && (
                  <span className="font-mono text-[8px] tracking-wider bg-black text-white px-1.5 py-0.5">
                    PINNED
                  </span>
                )}
              </div>
              <h4 className="font-mono text-[11px] font-medium tracking-wider truncate">
                {post.title}
              </h4>
              <p className="font-mono text-[10px] text-neutral-400 mt-1 line-clamp-1">
                {post.content}
              </p>
            </div>
            <button className="p-1 hover:bg-neutral-100 transition-colors ml-2 shrink-0">
              <MoreHorizontal size={14} className="text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- MEMBERS PANEL ----
function MembersPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
          {members.length} MEMBERS
        </span>
        <button className="font-mono text-[10px] tracking-[0.15em] bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
          + INVITE
        </button>
      </div>

      <div className="border border-neutral-200 divide-y divide-neutral-100">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-8 h-8 rounded-full object-cover grayscale"
              />
              <div>
                <div className="font-mono text-[11px] font-medium">{member.name}</div>
                <div className="font-mono text-[10px] text-neutral-400">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-[9px] tracking-wider px-2 py-0.5 ${
                  member.role === "owner"
                    ? "bg-black text-white"
                    : member.role === "admin"
                    ? "bg-neutral-200 text-neutral-700"
                    : "bg-neutral-50 text-neutral-500"
                }`}
              >
                {member.role.toUpperCase()}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  member.status === "active"
                    ? "bg-neutral-900"
                    : member.status === "pending"
                    ? "bg-neutral-400"
                    : "bg-red-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- MEDIA PANEL ----
function MediaPanel() {
  const { products } = useProducts();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
          MEDIA LIBRARY
        </span>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center gap-3 hover:border-neutral-400 transition-colors cursor-pointer">
        <Upload size={24} className="text-neutral-300" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400">
          DROP FILES OR CLICK TO UPLOAD
        </span>
        <span className="font-mono text-[9px] text-neutral-300">
          PNG, JPG, MP4 · MAX 50MB
        </span>
      </div>

      {/* Placeholder Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-6">
        {products.slice(0, 8).map((p) => (
          <div key={p.id} className="aspect-square bg-neutral-50 overflow-hidden">
            <img
              src={p.image}
              alt={p.sku}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
