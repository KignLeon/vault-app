"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, MapPin, Bell, CreditCard, LogOut, ChevronRight, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

type SettingsSection = "profile" | "account" | "shipping" | "notifications" | "payment";

const sections = [
  { id: "profile" as const, label: "PROFILE", icon: User },
  { id: "account" as const, label: "ACCOUNT", icon: Lock },
  { id: "shipping" as const, label: "SHIPPING", icon: MapPin },
  { id: "notifications" as const, label: "NOTIFICATIONS", icon: Bell },
  { id: "payment" as const, label: "PAYMENT INFO", icon: CreditCard },
];

export default function SettingsPage() {
  const { fg, border, isDark, cardBg, muted, accent, accentFg, accentGlow } = useTheme();
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (user) {
      await updateProfile({ displayName, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  const inputClass = "w-full bg-transparent border px-4 py-3 font-mono text-xs tracking-wider outline-none transition-colors focus:border-opacity-60";

  return (
    <AppShell>
      <div className="pt-6 pb-4 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
        <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: fg }}>SETTINGS</h1>
        <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: muted }}>
          @{user.username} · {user.role.replace("_", " ").toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 font-mono text-[10px] tracking-[0.15em] transition-all text-left"
                style={{
                  background: isActive ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)") : "transparent",
                  color: isActive ? fg : muted,
                  borderLeft: isActive ? `2px solid ${accent}` : "2px solid transparent",
                }}
              >
                <Icon size={14} /> {section.label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="w-full flex items-center gap-3 px-4 py-3 font-mono text-[10px] tracking-[0.15em] transition-all text-left"
              style={{ color: muted }}
            >
              <Shield size={14} /> ADMIN PANEL <ChevronRight size={10} className="ml-auto" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 font-mono text-[10px] tracking-[0.15em] transition-all text-left mt-4"
            style={{ color: muted, borderTop: `1px solid ${border}` }}
          >
            <LogOut size={14} /> SIGN OUT
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {activeSection === "profile" && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16 border" style={{ borderColor: border }}>
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="text-lg">{user.displayName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-mono text-sm font-bold tracking-wider" style={{ color: fg }}>{user.displayName}</p>
                    <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>@{user.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-mono text-[9px] tracking-[0.2em] block" style={{ color: muted }}>DISPLAY NAME</label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} style={{ borderColor: border, color: fg }} />
                </div>

                <div className="space-y-3">
                  <label className="font-mono text-[9px] tracking-[0.2em] block" style={{ color: muted }}>EMAIL</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" className={inputClass} style={{ borderColor: border, color: fg }} />
                </div>

                <button onClick={handleSave} className="px-6 py-3 font-mono text-[10px] tracking-[0.2em] active:scale-95 transition-transform" style={{ background: accent, color: accentFg }}>
                  {saved ? "SAVED ✓" : "SAVE CHANGES"}
                </button>
              </>
            )}

            {activeSection === "account" && (
              <>
                <h2 className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>SECURITY</h2>
                <div className="border p-4 space-y-3" style={{ borderColor: border, background: cardBg }}>
                  <p className="font-mono text-xs" style={{ color: fg }}>Password</p>
                  <p className="font-mono text-[10px]" style={{ color: muted }}>Change your password to keep your account secure</p>
                  <button className="px-4 py-2 border font-mono text-[10px] tracking-wider active:scale-95 transition-transform" style={{ borderColor: border, color: fg }}>
                    CHANGE PASSWORD
                  </button>
                </div>

                <div className="border p-4 space-y-3" style={{ borderColor: border, background: cardBg }}>
                  <p className="font-mono text-xs" style={{ color: fg }}>Sessions</p>
                  <p className="font-mono text-[10px]" style={{ color: muted }}>Manage active sessions across devices</p>
                  <button onClick={handleLogout} className="px-4 py-2 border font-mono text-[10px] tracking-wider text-red-400 border-red-400/30 active:scale-95 transition-transform">
                    SIGN OUT EVERYWHERE
                  </button>
                </div>

                <div className="border p-4 space-y-3" style={{ borderColor: border }}>
                  <p className="font-mono text-xs" style={{ color: fg }}>Account Info</p>
                  <div className="space-y-1">
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>USER ID: {user.id}</p>
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>ROLE: {user.role.replace("_", " ").toUpperCase()}</p>
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>JOINED: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </>
            )}

            {activeSection === "shipping" && (
              <>
                <h2 className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>SAVED ADDRESS</h2>
                <div className="space-y-3">
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ADDRESS" className={inputClass} style={{ borderColor: border, color: fg }} />
                  <div className="grid grid-cols-3 gap-3">
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="CITY" className={inputClass} style={{ borderColor: border, color: fg }} />
                    <input value={state} onChange={(e) => setState(e.target.value)} placeholder="STATE" className={inputClass} style={{ borderColor: border, color: fg }} />
                    <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className={inputClass} style={{ borderColor: border, color: fg }} />
                  </div>
                  <button className="px-6 py-3 font-mono text-[10px] tracking-[0.2em] active:scale-95 transition-transform" style={{ background: accent, color: accentFg }}>
                    SAVE ADDRESS
                  </button>
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <>
                <h2 className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>COMMUNICATION</h2>
                {[
                  { label: "Telegram", desc: "Order updates + direct communication" },
                  { label: "SMS", desc: "Text message notifications" },
                  { label: "Email", desc: "Order confirmations + receipts" },
                  { label: "WhatsApp", desc: "Alternative messaging channel" },
                ].map((channel) => (
                  <div key={channel.label} className="flex items-center justify-between border p-4" style={{ borderColor: border, background: cardBg }}>
                    <div>
                      <p className="font-mono text-xs" style={{ color: fg }}>{channel.label}</p>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>{channel.desc}</p>
                    </div>
                    <button className="px-3 py-1.5 border font-mono text-[9px] tracking-wider active:scale-95 transition-transform" style={{ borderColor: border, color: muted }}>
                      CONNECT
                    </button>
                  </div>
                ))}
              </>
            )}

            {activeSection === "payment" && (
              <>
                <h2 className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>PAYMENT METHODS</h2>
                <p className="font-mono text-xs leading-relaxed" style={{ color: muted }}>
                  GASCLUB247 supports multiple payment methods. After placing an order, you&apos;ll receive an order number and instructions for completing payment.
                </p>
                {[
                  { method: "Crypto", desc: "BTC, ETH, USDT accepted" },
                  { method: "Zelle", desc: "Instant bank transfer" },
                  { method: "Bank Wire", desc: "Direct wire transfer" },
                ].map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between border p-4" style={{ borderColor: border, background: cardBg }}>
                    <div>
                      <p className="font-mono text-xs" style={{ color: fg }}>{pm.method}</p>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>{pm.desc}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: muted }} />
                  </div>
                ))}
                <button onClick={() => router.push("/instructions")} className="w-full py-3 font-mono text-[10px] tracking-[0.2em] border active:scale-95 transition-transform" style={{ borderColor: border, color: fg }}>
                  VIEW PAYMENT INSTRUCTIONS →
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
