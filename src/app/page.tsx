"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GasclubLogo, GasclubWordmark, GasclubFooterLogo } from "@/components/ui/gasclub-logo";
import { Globe } from "@/components/ui/cobe-globe";
import { Lock, ArrowRight, Shield } from "lucide-react";

const SITE_PASSCODE = "GC247";

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

type ViewMode = "site" | "admin";

export default function AccessPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("site");
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [entering, setEntering] = useState(false);

  // Check if already have access
  useEffect(() => {
    try {
      if (localStorage.getItem("gc247_access") === "true") {
        router.push("/home");
      }
    } catch {}
  }, [router]);

  const handleSiteAccess = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === SITE_PASSCODE) {
      try { localStorage.setItem("gc247_access", "true"); } catch {}
      setEntering(true);
      setTimeout(() => router.push("/home"), 800);
    } else {
      setError("INVALID CODE");
      setTimeout(() => setError(""), 2000);
    }
  }, [code, router]);

  const handleAdminAccess = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminCode.trim();
    
    // Server-side only — passkey never stored in client bundle
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        // Store session tokens from server
        if (data.session?.access_token) {
          try { localStorage.setItem("gc247_session", JSON.stringify(data.session)); } catch {}
        }
        try { localStorage.setItem("gc247_access", "true"); localStorage.setItem("gc247_admin", "true"); } catch {}
        setEntering(true);
        setTimeout(() => router.push("/admin"), 800);
        return;
      }
      setAdminError(data.error || "INVALID PASSKEY");
      setTimeout(() => setAdminError(""), 2000);
    } catch {
      setAdminError("CONNECTION ERROR");
      setTimeout(() => setAdminError(""), 2000);
    }
  }, [adminCode, router]);

  const accentColor = "hsl(270, 70%, 65%)";

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

      <AnimatePresence mode="wait">
        {!entering ? (
          <motion.div
            key="access"
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

            {/* Mode Switcher */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-0 border border-white/10 w-full"
            >
              <button
                onClick={() => { setViewMode("site"); setError(""); setAdminError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.2em] transition-all ${
                  viewMode === "site" ? "text-black" : "text-white/30 hover:text-white/50"
                }`}
                style={{ background: viewMode === "site" ? accentColor : "transparent" }}
              >
                ENTER SITE
              </button>
              <button
                onClick={() => { setViewMode("admin"); setError(""); setAdminError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.2em] transition-all ${
                  viewMode === "admin" ? "text-black" : "text-white/30 hover:text-white/50"
                }`}
                style={{ background: viewMode === "admin" ? accentColor : "transparent" }}
              >
                <Shield size={10} />
                ADMIN
              </button>
            </motion.div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {viewMode === "site" ? (
                <motion.div
                  key="site"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="border border-white/10 bg-black/80 backdrop-blur-xl p-7 space-y-5">
                    <div className="text-center space-y-1.5">
                      <h2 className="font-mono text-sm tracking-[0.3em] font-bold text-white">PRIVATE ACCESS</h2>
                      <p className="font-mono text-[10px] tracking-wider text-white/40">Enter your access code to continue</p>
                    </div>
                    <form onSubmit={handleSiteAccess} className="space-y-3">
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="ACCESS CODE"
                          className={`w-full bg-transparent border ${
                            error ? "border-red-500/50" : "border-white/20"
                          } px-10 py-3 font-mono text-xs tracking-[0.25em] text-white placeholder:text-white/20 outline-none focus:border-white/50 transition-colors`}
                          autoComplete="off"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white active:scale-90 transition-all"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-mono text-[10px] tracking-[0.2em] text-red-400/70 text-center"
                        >
                          {error}
                        </motion.p>
                      )}
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="border border-white/10 bg-black/80 backdrop-blur-xl p-7 space-y-4">
                    <div className="text-center space-y-1.5">
                      <h2 className="font-mono text-sm tracking-[0.3em] font-bold text-white">ADMIN ACCESS</h2>
                      <p className="font-mono text-[10px] tracking-wider text-white/40">Restricted entry · Passkey required</p>
                    </div>
                    <form onSubmit={handleAdminAccess} className="space-y-3">
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="password"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          placeholder="ENTER PASSKEY"
                          className={`w-full bg-transparent border ${
                            adminError ? "border-red-500/50" : "border-white/20"
                          } px-10 py-3 font-mono text-xs tracking-[0.25em] text-white placeholder:text-white/20 outline-none focus:border-white/50 transition-colors`}
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white active:scale-90 transition-all"
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="font-mono text-[9px] tracking-[0.3em] text-white/15 text-center"
            >
              PRIVATE CLUB · PREMIUM DROPS · DIRECT ACCESS
            </motion.p>
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
    </div>
  );
}
