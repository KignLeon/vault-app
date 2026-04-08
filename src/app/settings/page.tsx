"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme, COLOR_PROFILES } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";
import {
  Bell, Mail, Phone, Check, Loader2, Sun, Moon, Palette,
  User, Truck, Info, Shield, ChevronRight, Sparkles, ExternalLink,
  Package, FileText, Download, RefreshCw, ShoppingCart, Users,
  Settings as SettingsIcon, Zap, Eye, Lock,
} from "lucide-react";

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadSaved(key: string, fallback: string = "") {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function savePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

// ── Section Card Wrapper ──────────────────────────────────────────────────────
function SettingsSection({
  icon: Icon,
  title,
  subtitle,
  children,
  accent,
  fg,
  border,
  muted,
  isDark,
  accentGlow,
  defaultOpen = true,
  badge,
}: {
  icon: typeof Bell;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent: string;
  fg: string;
  border: string;
  muted: string;
  isDark: boolean;
  accentGlow: string;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border overflow-hidden" style={{ borderColor: border }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 transition-colors"
        style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: accentGlow }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[11px] font-bold tracking-wider" style={{ color: fg }}>
              {title}
            </p>
            {badge && (
              <span
                className="font-mono text-[7px] tracking-[0.15em] px-1.5 py-0.5"
                style={{ background: accent, color: isDark ? "#000" : "#fff" }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>
              {subtitle}
            </p>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={14} style={{ color: muted }} />
        </motion.div>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-5 pt-1"
          style={{ borderTop: `1px solid ${border}` }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const theme = useTheme();
  const { isAdmin } = useAuth();
  const { fg, border, muted, accent, accentFg, isDark, accentGlow } = theme;

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
              PREFERENCES
            </span>
            <h1
              className="font-mono text-sm font-bold tracking-wider mt-0.5"
              style={{ color: fg }}
            >
              SETTINGS
            </h1>
          </div>
          {/* Role Badge */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <span
                className="font-mono text-[8px] tracking-[0.2em] px-2 py-1 flex items-center gap-1"
                style={{ background: accent, color: accentFg }}
              >
                <Shield size={9} />
                ADMIN
              </span>
            ) : (
              <span
                className="font-mono text-[8px] tracking-[0.2em] px-2 py-1 border flex items-center gap-1"
                style={{ borderColor: border, color: muted }}
              >
                <User size={9} />
                MEMBER
              </span>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto space-y-4">
          {/* ── 1. Theme & Appearance ── */}
          <ThemeSection {...theme} />

          {/* ── 2. Notifications ── */}
          <NotificationsSection accent={accent} accentFg={accentFg} fg={fg} border={border} muted={muted} isDark={isDark} accentGlow={accentGlow} />

          {/* ── 3. Checkout Preferences ── */}
          <CheckoutPrefsSection accent={accent} accentFg={accentFg} fg={fg} border={border} muted={muted} isDark={isDark} accentGlow={accentGlow} />

          {/* ── 4. Admin Tools (admin only) ── */}
          {isAdmin && (
            <AdminToolsSection accent={accent} accentFg={accentFg} fg={fg} border={border} muted={muted} isDark={isDark} accentGlow={accentGlow} />
          )}

          {/* ── 5. About ── */}
          <AboutSection accent={accent} fg={fg} border={border} muted={muted} isDark={isDark} accentGlow={accentGlow} />
        </div>
      </motion.div>
    </AppShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// THEME & APPEARANCE
// ══════════════════════════════════════════════════════════════════════════════
function ThemeSection(props: ReturnType<typeof useTheme>) {
  const { brightness, setBrightness, isDark, fg, border, muted, accent, accentGlow, colorProfile, setColorProfile } = props;

  return (
    <SettingsSection
      icon={Palette}
      title="THEME & APPEARANCE"
      subtitle="Customize colors and brightness"
      accent={accent}
      fg={fg}
      border={border}
      muted={muted}
      isDark={isDark}
      accentGlow={accentGlow}
    >
      <div className="space-y-5 pt-2">
        {/* Brightness */}
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-3" style={{ color: muted }}>
            BRIGHTNESS
          </span>
          <div className="flex items-center gap-3">
            <Moon size={13} style={{ color: muted }} />
            <div className="flex-1">
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <Sun size={13} style={{ color: muted }} />
            <span className="font-mono text-[9px] tracking-wider w-8 text-right" style={{ color: muted }}>
              {brightness}%
            </span>
          </div>
        </div>

        {/* Color Profiles */}
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-3" style={{ color: muted }}>
            COLOR SCHEME
          </span>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {COLOR_PROFILES.map((profile) => {
              const isActive = colorProfile.name === profile.name;
              const isNeutral = profile.saturation === 0;
              const l = isDark ? 55 : 45;
              const swatchGrad = isNeutral
                ? (isDark ? "linear-gradient(135deg, hsl(0,0%,45%), hsl(0,0%,65%))" : "linear-gradient(135deg, hsl(0,0%,30%), hsl(0,0%,50%))")
                : `linear-gradient(135deg, hsl(${profile.hue}, ${profile.saturation}%, ${l}%), hsl(${profile.hue2}, ${profile.saturation2}%, ${l}%))`;
              const glowColor = isNeutral
                ? (isDark ? "rgba(160,160,160,0.5)" : "rgba(80,80,80,0.4)")
                : `hsla(${profile.hue}, ${profile.saturation}%, ${l}%, 0.5)`;

              return (
                <button
                  key={profile.name}
                  onClick={() => setColorProfile(profile.name)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded transition-all active:scale-90"
                  style={{
                    background: isActive
                      ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")
                      : "transparent",
                    border: isActive ? `1px solid ${accent}` : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: swatchGrad,
                      boxShadow: isActive
                        ? `0 0 0 2px ${isDark ? "#fff" : "#000"}, 0 0 10px ${glowColor}`
                        : "none",
                    }}
                  >
                    {isActive && <Check size={10} style={{ color: "#fff" }} />}
                  </div>
                  <span
                    className="font-mono text-[7px] tracking-wider leading-none"
                    style={{ color: isActive ? fg : muted }}
                  >
                    {profile.name.toUpperCase().slice(0, 7)}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Active label */}
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
            <span className="text-base">{colorProfile.emoji}</span>
            <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: accent }}>
              {colorProfile.name.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
              · {isDark ? "DARK" : "LIGHT"} MODE
            </span>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsSection({ accent, accentFg, fg, border, muted, isDark, accentGlow }: {
  accent: string; accentFg: string; fg: string; border: string; muted: string; isDark: boolean; accentGlow: string;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none transition-colors";

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
    <SettingsSection
      icon={Bell}
      title="NOTIFICATIONS"
      subtitle="Get notified about restocks, drops & deals"
      accent={accent}
      fg={fg}
      border={border}
      muted={muted}
      isDark={isDark}
      accentGlow={accentGlow}
      defaultOpen={false}
    >
      <div className="space-y-3 pt-2">
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
            EMAIL FOR UPDATES
          </span>
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
        </div>
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
            PHONE / SMS
          </span>
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
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (!email && !phone)}
          className="flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 w-full justify-center"
          style={{ background: accent, color: accentFg }}
        >
          {saving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : saved ? (
            <Check size={11} />
          ) : null}
          {saving ? "SAVING..." : saved ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
        </button>

        <p className="font-mono text-[8px] tracking-wider text-center" style={{ color: muted }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECKOUT PREFERENCES
// ══════════════════════════════════════════════════════════════════════════════
function CheckoutPrefsSection({ accent, accentFg, fg, border, muted, isDark, accentGlow }: {
  accent: string; accentFg: string; fg: string; border: string; muted: string; isDark: boolean; accentGlow: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  // Load on mount
  useEffect(() => {
    setName(loadSaved("gc247_checkout_name"));
    setEmail(loadSaved("gc247_checkout_email"));
    setPhone(loadSaved("gc247_checkout_phone"));
  }, []);

  const handleSave = () => {
    savePref("gc247_checkout_name", name);
    savePref("gc247_checkout_email", email);
    savePref("gc247_checkout_phone", phone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls =
    "w-full bg-transparent border px-4 py-3 font-mono text-[10px] tracking-wider outline-none transition-colors";

  return (
    <SettingsSection
      icon={Truck}
      title="CHECKOUT PREFERENCES"
      subtitle="Save your info for faster checkout"
      accent={accent}
      fg={fg}
      border={border}
      muted={muted}
      isDark={isDark}
      accentGlow={accentGlow}
      defaultOpen={false}
    >
      <div className="space-y-3 pt-2">
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
            FULL NAME
          </span>
          <div className="relative">
            <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className={`${inputCls} pl-9`}
              style={{ borderColor: border, color: fg }}
            />
          </div>
        </div>
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
            EMAIL
          </span>
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
        </div>
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-1.5" style={{ color: muted }}>
            PHONE
          </span>
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
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] tracking-[0.2em] transition-all active:scale-95 w-full justify-center"
          style={{ background: accent, color: accentFg }}
        >
          {saved ? <Check size={11} /> : null}
          {saved ? "SAVED ✓" : "SAVE PREFERENCES"}
        </button>

        <p className="font-mono text-[8px] tracking-wider text-center" style={{ color: muted }}>
          Stored locally on this device only. Never shared.
        </p>
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN TOOLS (admin only)
// ══════════════════════════════════════════════════════════════════════════════
function AdminToolsSection({ accent, accentFg, fg, border, muted, isDark, accentGlow }: {
  accent: string; accentFg: string; fg: string; border: string; muted: string; isDark: boolean; accentGlow: string;
}) {
  const { logout } = useAuth();

  const adminLinks = [
    { label: "DASHBOARD", desc: "Full admin panel", href: "/admin", icon: SettingsIcon },
    { label: "INVENTORY", desc: "Manage products", href: "/admin#inventory", icon: Package },
    { label: "ORDERS", desc: "View & manage orders", href: "/admin#orders", icon: ShoppingCart },
    { label: "FEED MANAGER", desc: "Create & edit posts", href: "/admin#community", icon: FileText },
  ];

  return (
    <SettingsSection
      icon={Shield}
      title="ADMIN TOOLS"
      subtitle="Management & configuration"
      accent={accent}
      fg={fg}
      border={border}
      muted={muted}
      isDark={isDark}
      accentGlow={accentGlow}
      defaultOpen={true}
      badge="ADMIN"
    >
      <div className="space-y-4 pt-2">
        {/* Quick Links */}
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-2" style={{ color: muted }}>
            QUICK ACTIONS
          </span>
          <div className="space-y-1.5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 p-3 border transition-all hover:opacity-80 active:scale-[0.98]"
                  style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: accentGlow }}
                  >
                    <Icon size={13} style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] font-bold tracking-wider" style={{ color: fg }}>
                      {link.label}
                    </p>
                    <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
                      {link.desc}
                    </p>
                  </div>
                  <ChevronRight size={12} style={{ color: muted }} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Session Info */}
        <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-2" style={{ color: muted }}>
            SESSION
          </span>
          <div className="flex items-center gap-2 p-3 border" style={{ borderColor: border }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "rgb(34,197,94)" }} />
            <div className="flex-1 min-w-0">
              <span className="font-mono text-[10px] font-bold" style={{ color: fg }}>AUTHENTICATED</span>
              <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
                Tab-scoped session · Passkey required every time
              </p>
            </div>
            <Lock size={10} style={{ color: accent }} />
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => { logout(); window.location.href = "/"; }}
          className="w-full py-3 font-mono text-[10px] tracking-wider border transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgb(239,68,68)" }}
        >
          SIGN OUT
        </button>
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ABOUT
// ══════════════════════════════════════════════════════════════════════════════
function AboutSection({ accent, fg, border, muted, isDark, accentGlow }: {
  accent: string; fg: string; border: string; muted: string; isDark: boolean; accentGlow: string;
}) {
  return (
    <SettingsSection
      icon={Info}
      title="ABOUT GASCLUB247"
      subtitle="How it works & contact"
      accent={accent}
      fg={fg}
      border={border}
      muted={muted}
      isDark={isDark}
      accentGlow={accentGlow}
      defaultOpen={false}
    >
      <div className="space-y-4 pt-2">
        {/* How It Works */}
        <div>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-3" style={{ color: muted }}>
            HOW IT WORKS
          </span>
          <div className="space-y-2.5">
            {[
              { step: "1", title: "BROWSE", desc: "Explore our premium indoor inventory" },
              { step: "2", title: "ORDER", desc: "Add items to cart and checkout securely" },
              { step: "3", title: "PAY", desc: "Complete payment via Zelle or Crypto" },
              { step: "4", title: "RECEIVE", desc: "Fast, discreet delivery to your door" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[9px] font-bold"
                  style={{ background: accent, color: isDark ? "#000" : "#fff" }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-wider" style={{ color: fg }}>{item.title}</p>
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
          <span className="font-mono text-[9px] tracking-[0.15em] block mb-2" style={{ color: muted }}>
            CONTACT
          </span>
          <a
            href="sms:+13109940642"
            className="flex items-center gap-2 px-4 py-3 border transition-all active:scale-[0.98]"
            style={{ borderColor: border, color: fg }}
          >
            <Phone size={12} style={{ color: accent }} />
            <span className="font-mono text-[10px] tracking-wider">+1 (310) 994-0642</span>
            <ExternalLink size={10} className="ml-auto" style={{ color: muted }} />
          </a>
        </div>

        {/* Trust / Security */}
        <div className="flex items-center gap-3 p-3" style={{ background: accentGlow, borderLeft: `2px solid ${accent}` }}>
          <Shield size={14} style={{ color: accent }} />
          <div>
            <p className="font-mono text-[9px] tracking-wider font-bold" style={{ color: fg }}>SECURE PLATFORM</p>
            <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>Encrypted transactions · Private access · No data shared</p>
          </div>
        </div>

        {/* Credit */}
        <div className="text-center pt-2">
          <a
            href="https://lovoson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.2em] transition-opacity hover:opacity-100"
            style={{ color: muted }}
          >
            <Sparkles size={8} />
            DESIGNED BY LOVOSON MEDIA
          </a>
          <p className="font-mono text-[7px] tracking-wider mt-1" style={{ color: `${muted}60` }}>
            © {new Date().getFullYear()} GASCLUB247. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}
