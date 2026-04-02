"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GasclubLogo, GasclubWordmark } from "@/components/ui/gasclub-logo";
import { Globe } from "@/components/ui/cobe-globe";
import { useAuth } from "@/lib/auth";
import { OnboardingForm } from "@/components/ui/onboarding-form";
import { Lock, ArrowRight, Shield } from "lucide-react";

const globeMarkers = [
  { id: "sf", location: [37.7595, -122.4367] as [number, number], label: "San Francisco" },
  { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
  { id: "tokyo", location: [35.6762, 139.6503] as [number, number], label: "Tokyo" },
  { id: "london", location: [51.5074, -0.1278] as [number, number], label: "London" },
  { id: "dubai", location: [25.2048, 55.2708] as [number, number], label: "Dubai" },
  { id: "la", location: [34.0522, -118.2437] as [number, number], label: "Los Angeles" },
];

const globeArcs = [
  { id: "sf-tokyo", from: [37.7595, -122.4367] as [number, number], to: [35.6762, 139.6503] as [number, number], label: "SF → Tokyo" },
  { id: "nyc-london", from: [40.7128, -74.006] as [number, number], to: [51.5074, -0.1278] as [number, number], label: "NYC → London" },
  { id: "la-dubai", from: [34.0522, -118.2437] as [number, number], to: [25.2048, 55.2708] as [number, number], label: "LA → Dubai" },
];

type ViewMode = "account" | "admin";

export default function AccessPage() {
  const router = useRouter();
  const { signup, login, adminLogin, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("account");
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin passkey state
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && !entering) {
      router.push("/home");
    }
  }, [isAuthenticated, entering, router]);

  const handleAccountSubmit = useCallback(async (data: { username: string; password: string; avatar?: string }) => {
    setSubmitting(true);
    setError("");

    let result;
    if (authMode === "signup") {
      result = await signup(data.username, data.password, data.avatar);
    } else {
      result = await login(data.username, data.password);
    }

    if (result.success) {
      setEntering(true);
      setTimeout(() => router.push("/home"), 800);
    } else {
      setError(result.error || "Something went wrong");
    }
    setSubmitting(false);
  }, [authMode, signup, login, router]);

  const handleAdminSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await adminLogin(adminCode);
    if (result.success) {
      setEntering(true);
      setTimeout(() => router.push("/home"), 800);
    } else {
      setAdminError(result.error || "INVALID CODE");
      setTimeout(() => setAdminError(""), 2000);
    }
  }, [adminCode, adminLogin, router]);

  // Accent color for auth page (always midnight blue on dark bg)
  const accentColor = "hsl(220, 60%, 62%)";

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
            markerColor={[0.4, 0.5, 0.7]}
            arcColor={[0.3, 0.4, 0.6]}
            mapBrightness={3}
            speed={0.001}
            markerSize={0.02}
            markerElevation={0.01}
          />
        </div>
      </div>

      {/* Content */}
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

            {/* Mode Switcher: Account vs Admin */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-0 border border-white/10 w-full"
            >
              <button
                onClick={() => setViewMode("account")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.2em] transition-all ${
                  viewMode === "account" ? "text-black" : "text-white/30 hover:text-white/50"
                }`}
                style={{
                  background: viewMode === "account" ? accentColor : "transparent",
                }}
              >
                ACCOUNT
              </button>
              <button
                onClick={() => setViewMode("admin")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-[0.2em] transition-all ${
                  viewMode === "admin" ? "text-black" : "text-white/30 hover:text-white/50"
                }`}
                style={{
                  background: viewMode === "admin" ? accentColor : "transparent",
                }}
              >
                <Shield size={10} />
                ADMIN
              </button>
            </motion.div>

            {/* Account Flow */}
            <AnimatePresence mode="wait">
              {viewMode === "account" ? (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <OnboardingForm
                    mode={authMode}
                    onToggleMode={() => {
                      setAuthMode(authMode === "signup" ? "signin" : "signup");
                      setError("");
                    }}
                    onSubmit={handleAccountSubmit}
                    isSubmitting={submitting}
                    error={error}
                  />
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

                    <form onSubmit={handleAdminSubmit} className="space-y-3">
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

            {/* Tagline */}
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
    </div>
  );
}
