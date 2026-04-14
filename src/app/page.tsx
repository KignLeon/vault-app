"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GasclubLogo, GasclubWordmark, GasclubFooterLogo } from "@/components/ui/gasclub-logo";
import { Globe } from "@/components/ui/cobe-globe";
import { Lock, ArrowRight, Shield, ChevronRight, User } from "lucide-react";

const globeMarkers = [
  { id: "sf", location: [37.7595, -122.4367] as [number, number], label: "San Francisco" },
  { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
  { id: "la", location: [34.0522, -118.2437] as [number, number], label: "Los Angeles" },
  { id: "miami", location: [25.7617, -80.1918] as [number, number], label: "Miami" },
  { id: "chicago", location: [41.8781, -87.6298] as [number, number], label: "Chicago" },
  { id: "atl", location: [33.749, -84.388] as [number, number], label: "Atlanta" },
];

const globeArcs = [
  { id: "a1", from: [37.7595, -122.4367] as [number, number], to: [40.7128, -74.006] as [number, number], label: "SF → NYC" },
  { id: "a2", from: [34.0522, -118.2437] as [number, number], to: [25.7617, -80.1918] as [number, number], label: "LA → Miami" },
  { id: "a3", from: [41.8781, -87.6298] as [number, number], to: [33.749, -84.388] as [number, number], label: "CHI → ATL" },
];

type AccessMode = "user" | "admin";

export default function WelcomePage() {
  const router = useRouter();
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [entering, setEntering] = useState(false);
  const [mode, setMode] = useState<AccessMode>("user");

  const accentColor = "hsl(270, 70%, 65%)";

  // ── User enters the site ────────────────────────────────────────────────────
  const handleEnter = useCallback(() => {
    setEntering(true);
    setTimeout(() => { window.location.href = "/inventory"; }, 600);
  }, []);

  // ── Admin passkey verification ──────────────────────────────────────────────
  const handleAdminAccess = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminCode.trim();
    
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.session?.access_token) {
          try { sessionStorage.setItem("gc247_session", JSON.stringify(data.session)); } catch {}
        }
        try { sessionStorage.setItem("gc247_admin", "true"); } catch {}
        setEntering(true);
        setTimeout(() => { window.location.href = "/admin"; }, 1200);
        return;
      }
      setAdminError(data.error || "INVALID PASSKEY");
      setTimeout(() => setAdminError(""), 2000);
    } catch {
      setAdminError("CONNECTION ERROR");
      setTimeout(() => setAdminError(""), 2000);
    }
  }, [adminCode, router]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] bg-black text-white overflow-hidden">
      {/* Globe Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <div className="w-[500px] max-w-[85vw]">
          <Globe
            markers={globeMarkers}
            arcs={globeArcs}
            dark={1}
            baseColor={[0.12, 0.12, 0.12]}
            glowColor={[0.03, 0.03, 0.03]}
            markerColor={[0.4, 0.3, 0.7]}
            arcColor={[0.4, 0.3, 0.7]}
            mapBrightness={3}
            speed={0.001}
            markerSize={0.02}
            markerElevation={0.01}
          />
        </div>
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <AnimatePresence mode="wait">
        {!entering ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-sm"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <GasclubLogo size={56} className="text-white" accentColor={accentColor} />
              <GasclubWordmark className="text-white/70" accentColor={accentColor} size="large" />
            </motion.div>

            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-1.5"
            >
              <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
                PREMIUM INDOOR · DIRECT ACCESS
              </p>
            </motion.div>

            {/* ── Mode Switcher ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="w-full flex border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setMode("user")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-[0.2em] transition-all duration-200"
                style={{
                  background: mode === "user" ? accentColor : "transparent",
                  color: mode === "user" ? "#000" : "rgba(255,255,255,0.35)",
                }}
              >
                <User size={11} />
                BROWSE
              </button>
              <button
                onClick={() => setMode("admin")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-[0.2em] transition-all duration-200 border-l border-white/10"
                style={{
                  background: mode === "admin" ? "rgba(255,255,255,0.08)" : "transparent",
                  color: mode === "admin" ? accentColor : "rgba(255,255,255,0.35)",
                }}
              >
                <Shield size={11} />
                ADMIN
              </button>
            </motion.div>

            {/* ── Content Area (switches based on mode) ── */}
            <AnimatePresence mode="wait">
              {mode === "user" ? (
                /* ═══ USER MODE ═══ */
                <motion.div
                  key="user-mode"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <button
                    onClick={handleEnter}
                    className="w-full group relative overflow-hidden"
                    style={{ background: accentColor }}
                  >
                    <div className="flex items-center justify-center gap-3 py-4 font-mono text-sm tracking-[0.3em] font-bold text-black transition-all group-hover:gap-4 group-active:scale-[0.98]">
                      ENTER
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </div>
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                        animation: "shimmer 2s ease-in-out infinite",
                      }}
                    />
                  </button>
                </motion.div>
              ) : (
                /* ═══ ADMIN MODE ═══ */
                <motion.div
                  key="admin-mode"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <div className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                    {/* Admin header */}
                    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
                      <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: accentColor }}>
                        ADMIN ACCESS
                      </span>
                    </div>

                    {/* Admin form */}
                    <form onSubmit={handleAdminAccess} className="px-4 pb-3 space-y-2">
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="password"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          placeholder="ENTER PASSKEY"
                          className={`w-full bg-transparent border ${
                            adminError ? "border-red-500/50" : "border-white/15"
                          } px-10 py-3.5 font-mono text-xs tracking-[0.25em] text-white placeholder:text-white/20 outline-none focus:border-white/40 transition-colors`}
                          autoComplete="off"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-all active:scale-90"
                          style={{ color: adminCode.length > 0 ? accentColor : "rgba(255,255,255,0.25)" }}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      {adminError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-mono text-[10px] tracking-[0.2em] text-red-400/70 text-center"
                        >
                          {adminError}
                        </motion.p>
                      )}
                    </form>

                    <div className="px-4 pb-4">
                      <p className="font-mono text-[8px] tracking-wider text-white/15 text-center">
                        PASSKEY REQUIRED EVERY SESSION
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="entering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 0.8], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8 }}
            >
              <GasclubLogo size={56} className="text-white" accentColor={accentColor} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branded Footer — GC247 × Lovoson Media */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col items-center gap-3 px-4">
          <div className="flex items-center gap-4">
            <GasclubFooterLogo isDark={true} />
            <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>×</span>
            <a
              href="https://lovoson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Lovoson"
            >
              <img
                src="/lovoson-icon.svg"
                alt="Lovoson"
                style={{ height: 24, width: "auto", filter: "invert(1)" }}
              />
            </a>
          </div>
          <a
            href="https://lovoson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[8px] tracking-[0.25em] hover:opacity-100 transition-opacity"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            DESIGNED BY LOVOSON MEDIA
          </a>
        </div>
      </div>

      {/* Shimmer keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
