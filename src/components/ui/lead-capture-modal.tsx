"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Sparkles, Copy, Check, Gift } from "lucide-react";
import { useTheme } from "@/lib/theme";

const STORAGE_KEY = "gc247_lead_captured";
const AUTO_DELAY_MS = 2000; // 2s delay before auto-show on /home

// Global state to allow navbar icon to toggle modal
let _setOpenGlobal: ((v: boolean) => void) | null = null;
export function openLeadModal() { _setOpenGlobal?.(true); }

export function LeadCaptureModal() {
  const { fg, border, muted, accent, accentFg, accentGlow, isDark } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Expose open setter globally for navbar icon
  useEffect(() => {
    _setOpenGlobal = setOpen;
    return () => { _setOpenGlobal = null; };
  }, []);

  // Auto-open logic: ONLY on /home, ONLY if not already captured, with delay
  useEffect(() => {
    // Check if already captured/dismissed
    try { if (localStorage.getItem(STORAGE_KEY)) { setDismissed(true); return; } } catch {}

    // Only auto-trigger on the feed page
    if (pathname !== "/home") return;

    const timer = setTimeout(() => setOpen(true), AUTO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setDismissed(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) { setError("Please enter your email or phone."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoCode(data.promoCode);
        setSuccess(true);
        setDismissed(true);
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      } else {
        setError("Something went wrong. Try again.");
      }
    } catch { setError("Connection error. Try again."); }
    setSubmitting(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Navbar Gift icon — always shown after dismiss or on non-home pages */}
      <AnimatePresence>
        {(dismissed || pathname !== "/home") && !open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            className="relative flex items-center justify-center w-7 h-7 rounded-full transition-all active:scale-90"
            style={{ background: accentGlow, border: `1px solid ${accent}` }}
            aria-label="Open members club offer"
            title={success ? "View your promo code" : "Get 20% off your first order"}
          >
            <Gift size={13} style={{ color: accent }} />
            {!success && !dismissed && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: accent }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              onClick={handleDismiss}
            />

            {/* Glass Modal */}
            <div
              className="fixed inset-0 z-[201] flex items-center justify-center"
              style={{ pointerEvents: "none", padding: "24px 16px", minHeight: "100dvh" }}
            >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full"
              style={{ maxWidth: "min(90vw, 380px)", pointerEvents: "auto" }}
            >
              <div
                className="relative w-full rounded-xl overflow-hidden"
                style={{
                  background: isDark
                    ? "rgba(8,8,8,0.88)"
                    : "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  boxShadow: isDark
                    ? "0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                {/* Accent top bar */}
                <div className="h-[2px] w-full" style={{ background: accent }} />

                {/* Close */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-1.5 hover:opacity-70 transition-opacity active:scale-90 rounded-full"
                  style={{ color: muted, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                  aria-label="Close"
                >
                  <X size={13} />
                </button>

                <div className="p-7">
                  {!success ? (
                    <>
                      {/* Header */}
                      <div className="flex flex-col items-center gap-2 mb-6 text-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                          style={{ background: accentGlow }}
                        >
                          <Sparkles size={18} style={{ color: accent }} />
                        </div>
                        <span className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: accent }}>
                          MEMBERS CLUB
                        </span>
                        <h2 className="font-mono text-sm font-bold tracking-wider" style={{ color: fg }}>
                          GET 20% OFF
                        </h2>
                        <p className="font-mono text-[10px] tracking-wider leading-relaxed" style={{ color: muted }}>
                          Join the private club. Exclusive drops &amp; member pricing.
                        </p>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-2.5">
                        <div className="relative">
                          <Mail size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: muted }} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="EMAIL ADDRESS"
                            className="w-full bg-transparent border pl-9 pr-4 py-3 font-mono text-[10px] tracking-[0.15em] outline-none rounded-lg transition-colors"
                            style={{
                              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                              color: fg,
                              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                            }}
                          />
                        </div>
                        <div className="relative">
                          <Phone size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: muted }} />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="PHONE (OPTIONAL)"
                            className="w-full bg-transparent border pl-9 pr-4 py-3 font-mono text-[10px] tracking-[0.15em] outline-none rounded-lg transition-colors"
                            style={{
                              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                              color: fg,
                              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                            }}
                          />
                        </div>
                        {error && <p className="font-mono text-[9px] tracking-wider text-red-400">{error}</p>}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3.5 font-mono text-[10px] tracking-[0.2em] font-bold transition-all active:scale-[0.98] disabled:opacity-50 rounded-lg mt-1"
                          style={{ background: accent, color: accentFg }}
                        >
                          {submitting ? "JOINING..." : "CLAIM 20% OFF →"}
                        </button>
                        <p className="font-mono text-[8px] tracking-wider text-center" style={{ color: muted }}>
                          No spam. Unsubscribe anytime.
                        </p>
                      </form>
                    </>
                  ) : (
                    /* Success */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-4 py-2 text-center"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: accentGlow }}>
                        <Sparkles size={20} style={{ color: accent }} />
                      </div>
                      <div>
                        <h2 className="font-mono text-sm font-bold tracking-wider" style={{ color: fg }}>YOU&apos;RE IN. 🔥</h2>
                        <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: muted }}>Your exclusive code:</p>
                      </div>
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-3 border px-5 py-3 transition-all active:scale-95 w-full justify-center rounded-lg"
                        style={{ borderColor: accent, background: accentGlow }}
                      >
                        <span className="font-mono text-base font-bold tracking-[0.3em]" style={{ color: accent }}>{promoCode}</span>
                        {copied ? <Check size={14} style={{ color: accent }} /> : <Copy size={14} style={{ color: muted }} />}
                      </button>
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                        {copied ? "COPIED!" : "TAP TO COPY"} · 20% off your first order
                      </p>
                      <button
                        onClick={() => setOpen(false)}
                        className="w-full py-3 font-mono text-[10px] tracking-[0.2em] border transition-all active:scale-[0.98] rounded-lg"
                        style={{ borderColor: border, color: fg }}
                      >
                        SHOP NOW →
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
