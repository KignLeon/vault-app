"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import {
  User, Package, Shield, Settings, LogOut, ChevronRight,
  Lock, Bell, CreditCard, MapPin, Star, Eye, EyeOff,
  Check, AlertCircle, Loader2, Mail, Phone,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section =
  | "profile"
  | "orders"
  | "addresses"
  | "security"
  | "notifications"
  | "membership";

interface NavItem {
  id: Section;
  label: string;
  icon: typeof User;
  description: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile",       label: "PROFILE",       icon: User,        description: "Display name, email, avatar" },
  { id: "orders",        label: "MY ORDERS",      icon: Package,     description: "Order history & tracking" },
  { id: "addresses",     label: "ADDRESSES",      icon: MapPin,      description: "Saved delivery addresses" },
  { id: "security",      label: "SECURITY",       icon: Lock,        description: "Password & account security" },
  { id: "notifications", label: "NOTIFICATIONS",  icon: Bell,        description: "Alerts & updates" },
  { id: "membership",    label: "MEMBERSHIP",     icon: Star,        description: "Role & access level" },
];

// ── Animation Variants ────────────────────────────────────────────────────────
const panelVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, x: -6, transition: { duration: 0.15 } },
};

const itemVariants = {
  hidden:   { opacity: 0, x: -10 },
  visible:  (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04 } }),
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { fg, border, muted, accent, accentFg, isDark, cardBg, accentGlow } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [mobileSection, setMobileSection] = useState<Section | null>(null);

  const navItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Mobile: render only the list or the panel
  const showMobilePanel = mobileSection !== null;

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle size={28} style={{ color: muted }} />
          <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
            NOT SIGNED IN
          </p>
        </div>
      </AppShell>
    );
  }

  const section = showMobilePanel ? mobileSection! : activeSection;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-4 pb-32"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-5 mb-6"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div>
            <span
              className="font-mono text-[9px] tracking-[0.3em] uppercase"
              style={{ color: muted }}
            >
              SETTINGS
            </span>
            <h1
              className="font-mono text-sm font-bold tracking-wider mt-0.5"
              style={{ color: fg }}
            >
              {user.displayName || user.username}
            </h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] px-3 py-2 border transition-all active:scale-95 hover:opacity-80"
            style={{ borderColor: border, color: muted }}
          >
            <LogOut size={11} />
            SIGN OUT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* ── Sidebar Nav ── */}
          <div
            className={`md:col-span-4 ${showMobilePanel ? "hidden" : "block"} md:block`}
          >
            {/* User card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 mb-4 border"
              style={{ borderColor: border, background: cardBg }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold flex-shrink-0"
                style={{ background: accentGlow, color: accent }}
              >
                {(user.displayName || user.username)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-[11px] font-bold tracking-wider truncate"
                  style={{ color: fg }}
                >
                  @{user.username}
                </p>
                <p
                  className="font-mono text-[9px] tracking-[0.15em] uppercase mt-0.5"
                  style={{ color: accent }}
                >
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </motion.div>

            {/* Nav list */}
            <nav className="space-y-0.5">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = (activeSection === item.id) && !showMobilePanel;
                return (
                  <motion.button
                    key={item.id}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileSection(item.id); // open panel on mobile
                    }}
                    className="group w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:scale-[0.99] border-b"
                    style={{
                      background: isActive
                        ? isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.03)"
                        : "transparent",
                      borderColor: border,
                      borderLeft: isActive ? `2px solid ${accent}` : "2px solid transparent",
                    }}
                  >
                    <Icon
                      size={14}
                      style={{ color: isActive ? accent : muted }}
                      className="flex-shrink-0 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-mono text-[10px] tracking-[0.12em] font-bold"
                        style={{ color: isActive ? fg : muted }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="font-mono text-[8px] tracking-wider mt-0.5 hidden sm:block"
                        style={{ color: muted, opacity: 0.6 }}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      size={12}
                      style={{
                        color: isActive ? accent : muted,
                        opacity: isActive ? 1 : 0,
                      }}
                      className="flex-shrink-0 transition-all group-hover:opacity-100"
                    />
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* ── Panel Content ── */}
          <div
            className={`md:col-span-8 ${!showMobilePanel ? "hidden" : "block"} md:block`}
          >
            {/* Mobile back button */}
            {showMobilePanel && (
              <button
                onClick={() => setMobileSection(null)}
                className="flex items-center gap-2 font-mono text-[9px] tracking-[0.15em] mb-4 active:opacity-70"
                style={{ color: muted }}
              >
                ← BACK
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {section === "profile"       && <ProfilePanel user={user} />}
                {section === "orders"        && <OrdersPanel userId={user.id} />}
                {section === "addresses"     && <AddressPanel user={user} />}
                {section === "security"      && <SecurityPanel />}
                {section === "notifications" && <NotificationsPanel />}
                {section === "membership"    && <MembershipPanel user={user} isAdmin={isAdmin} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}

// ── Shared Helpers ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { fg, border, muted } = useTheme();
  return (
    <div className="mb-6 pb-4" style={{ borderBottom: `1px solid ${border}` }}>
      <h2 className="font-mono text-[11px] tracking-[0.25em] font-bold" style={{ color: fg }}>
        {title}
      </h2>
      {subtitle && (
        <p className="font-mono text-[9px] tracking-wider mt-1" style={{ color: muted }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { muted } = useTheme();
  return (
    <div>
      <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
  disabled,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
}) {
  const { accent, accentFg } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50"
      style={{ background: accent, color: accentFg }}
    >
      {saving ? (
        <Loader2 size={11} className="animate-spin" />
      ) : saved ? (
        <Check size={11} />
      ) : null}
      {saving ? "SAVING..." : saved ? "SAVED" : "SAVE CHANGES"}
    </button>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ user }: { user: any }) {
  const { fg, border, muted, accent, accentGlow } = useTheme();
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(
    user.email?.includes("@gasclub247.app") ? "" : (user.email || "")
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { display_name: displayName } });
      if (authError) { setError(authError.message); setSaving(false); return; }
      const { error: dbError } = await (supabase as any)
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (dbError) { setError(dbError.message); setSaving(false); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Unexpected error.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="PROFILE" subtitle="Manage your display name and account info" />

      {/* Avatar block */}
      <div className="flex items-center gap-4 p-4 border" style={{ borderColor: border }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-lg font-bold flex-shrink-0"
          style={{ background: accentGlow, color: accent }}
        >
          {(user.displayName || user.username)[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider" style={{ color: fg }}>
            @{user.username}
          </p>
          <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>
            Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="DISPLAY NAME">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className={inputCls}
            style={{ borderColor: border, color: fg }}
          />
        </Field>
        <Field label="EMAIL">
          <input
            value={email}
            type="email"
            readOnly
            placeholder="—"
            className={inputCls}
            style={{ borderColor: border, color: fg, opacity: 0.6 }}
          />
        </Field>
      </div>

      {error && <p className="font-mono text-[9px] text-red-400">{error}</p>}
      <SaveButton onClick={handleSave} saving={saving} saved={saved} />
    </div>
  );
}

// ── Orders Panel ──────────────────────────────────────────────────────────────
function OrdersPanel({ userId }: { userId: string }) {
  const { fg, border, muted, accent } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from("orders")
      .select("id, order_number, total, status, created_at, items")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [userId]);

  const STATUS_COLORS: Record<string, string> = {
    pending:    "text-yellow-400",
    paid:       "text-green-400",
    processing: "text-blue-400",
    shipped:    "text-purple-400",
    completed:  "text-neutral-400",
    cancelled:  "text-red-400",
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="MY ORDERS" subtitle="Your complete order history" />
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={18} className="animate-spin" style={{ color: muted }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-14">
          <Package size={28} className="mx-auto mb-3" style={{ color: muted, opacity: 0.4 }} />
          <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>
            NO ORDERS YET
          </p>
        </div>
      ) : (
        <div className="border divide-y" style={{ borderColor: border }}>
          {orders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] font-bold tracking-wider" style={{ color: fg }}>
                  {order.order_number}
                </p>
                <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {Array.isArray(order.items) ? order.items.length : "?"} items
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>
                  ${Number(order.total).toFixed(2)}
                </span>
                <span
                  className={`font-mono text-[8px] tracking-wider ${STATUS_COLORS[order.status] || ""}`}
                >
                  {order.status?.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Address Panel ─────────────────────────────────────────────────────────────
function AddressPanel({ user }: { user: any }) {
  const { fg, border, muted } = useTheme();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from profile if stored
    (supabase as any)
      .from("profiles")
      .select("address, city, state, zip")
      .eq("id", user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setAddress(data.address || "");
          setCity(data.city || "");
          setState(data.state || "");
          setZip(data.zip || "");
        }
      });
  }, [user.id]);

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none";

  const handleSave = async () => {
    setSaving(true);
    await (supabase as any)
      .from("profiles")
      .update({ address, city, state, zip })
      .eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="DELIVERY ADDRESSES" subtitle="Saved for faster checkout" />
      <div className="space-y-3">
        <Field label="STREET ADDRESS">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
            className={inputCls}
            style={{ borderColor: border, color: fg }}
          />
        </Field>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-3">
            <Field label="CITY">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={inputCls}
                style={{ borderColor: border, color: fg }}
              />
            </Field>
          </div>
          <div className="col-span-1">
            <Field label="ST">
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="TX"
                className={inputCls}
                style={{ borderColor: border, color: fg }}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="ZIP">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="78201"
                className={inputCls}
                style={{ borderColor: border, color: fg }}
              />
            </Field>
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} saving={saving} saved={saved} />
    </div>
  );
}

// ── Security Panel ────────────────────────────────────────────────────────────
function SecurityPanel() {
  const { fg, border, muted } = useTheme();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none";

  const handleSave = async () => {
    if (newPw !== confirm) { setError("Passwords do not match."); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setCurrent("");
      setNewPw("");
      setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="SECURITY" subtitle="Update your password" />
      <div className="space-y-3">
        <Field label="NEW PASSWORD">
          <div className="relative">
            <input
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              className={`${inputCls} pr-12`}
              style={{ borderColor: border, color: fg }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: muted }}
            >
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </Field>
        <Field label="CONFIRM PASSWORD">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type={showPw ? "text" : "password"}
            placeholder="Re-enter password"
            className={inputCls}
            style={{ borderColor: border, color: fg }}
          />
        </Field>
      </div>
      {error && <p className="font-mono text-[9px] text-red-400">{error}</p>}
      <SaveButton onClick={handleSave} saving={saving} saved={saved} disabled={!newPw || !confirm} />
    </div>
  );
}

// ── Notifications Panel ───────────────────────────────────────────────────────
function NotificationsPanel() {
  const { fg, border, muted, accent, accentFg } = useTheme();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none";

  const handleSave = async () => {
    if (!email && !phone) return;
    setSaving(true);
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="NOTIFICATIONS"
        subtitle="Get restocks, drops, and order updates"
      />
      <div className="space-y-3">
        <Field label="EMAIL FOR UPDATES">
          <div className="relative">
            <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              className={`${inputCls} pl-9`}
              style={{ borderColor: border, color: fg }}
            />
          </div>
        </Field>
        <Field label="PHONE / SMS">
          <div className="relative">
            <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+1 (555) 000-0000"
              className={`${inputCls} pl-9`}
              style={{ borderColor: border, color: fg }}
            />
          </div>
        </Field>
      </div>
      <SaveButton onClick={handleSave} saving={saving} saved={saved} disabled={!email && !phone} />
    </div>
  );
}

// ── Membership Panel ──────────────────────────────────────────────────────────
function MembershipPanel({ user, isAdmin }: { user: any; isAdmin: boolean }) {
  const { fg, border, muted, accent, accentFg, accentGlow } = useTheme();

  const ROLE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
    member:         { label: "MEMBER",         desc: "Basic access — pending approval", color: muted },
    approved_buyer: { label: "APPROVED BUYER", desc: "Full catalog + ordering access",  color: "hsl(145,60%,45%)" },
    admin:          { label: "ADMIN",           desc: "Admin control panel access",      color: accent },
    super_admin:    { label: "SUPER ADMIN",     desc: "Full platform control",           color: accent },
  };

  const role = ROLE_LABELS[user.role] || ROLE_LABELS.member;

  return (
    <div className="space-y-4">
      <SectionHeader title="MEMBERSHIP" subtitle="Your role and access level" />

      <div className="border p-5 space-y-4" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold"
            style={{ background: accentGlow, color: accent }}
          >
            <Shield size={16} style={{ color: accent }} />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold tracking-wider" style={{ color: role.color as string }}>
              {role.label}
            </p>
            <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>
              {role.desc}
            </p>
          </div>
        </div>

        {user.purchase_count > 0 && (
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
            <Package size={13} style={{ color: muted }} />
            <span className="font-mono text-[10px] tracking-wider" style={{ color: fg }}>
              {user.purchase_count} order{user.purchase_count !== 1 ? "s" : ""} placed
            </span>
          </div>
        )}
      </div>

      {user.role === "member" && (
        <div
          className="p-4 border"
          style={{ borderColor: border, background: accentGlow }}
        >
          <p className="font-mono text-[9px] tracking-wider leading-relaxed" style={{ color: muted }}>
            Your account is pending approval. Once approved to Buyer status, you&apos;ll have
            full access to place orders and browse the complete catalog.
          </p>
        </div>
      )}
    </div>
  );
}
