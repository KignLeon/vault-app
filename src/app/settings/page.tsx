"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import {
  Bell, Mail, Phone, Check, Loader2,
} from "lucide-react";

// ── Main Page — simplified for public site (no user accounts) ─────────────────
export default function SettingsPage() {
  const { fg, border, muted, accent, accentFg, isDark, cardBg, accentGlow } = useTheme();

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
              NOTIFICATIONS
            </h1>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {/* Notifications / Subscribe panel */}
          <NotificationsPanel />
        </div>
      </motion.div>
    </AppShell>
  );
}

// ── Notifications Panel ───────────────────────────────────────────────────────
function NotificationsPanel() {
  const { fg, border, muted, accent, accentFg, accentGlow } = useTheme();
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
    <div className="space-y-5">
      {/* Info card */}
      <div className="border p-5 space-y-3" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: accentGlow }}
          >
            <Bell size={16} style={{ color: accent }} />
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold tracking-wider" style={{ color: fg }}>
              STAY UPDATED
            </p>
            <p className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: muted }}>
              Get notified about restocks, drops, and exclusive deals
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
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
  );
}
