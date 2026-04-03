"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Sparkles, Copy, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";

const STORAGE_KEY = "gc247_lead_captured";
const DELAY_MS = 25000; // 25 seconds after first visit

export function LeadCaptureModal() {
  const { fg, border, muted, accent, accentFg, accentGlow, isDark, cardBg } = useTheme();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Don't show if already captured
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    // Don't set storage on dismiss — let it show once per session only
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please enter your email or phone number.");
      return;
    }
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
        try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      } else {
        setError("Something went wrong. Try again.");
      }
    } catch {
      setError("Connection error. Try again.");
    }
    setSubmitting(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-[201] w-full sm:max-w-sm sm:w-full"
            style={{ maxWidth: "min(100vw, 400px)", margin: "0 auto" }}
          >
            <div
              className="relative border w-full"
              style={{
                background: isDark ? "#060606" : "#fff",
                borderColor: border,
                borderBottom: "none",
                borderLeft: "none",
                borderRight: "none",
              }}
            >
              {/* Accent stripe top */}
              <div className="h-[2px] w-full" style={{ background: accent }} />

              {/* Close */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 hover:opacity-70 transition-opacity active:scale-90"
                style={{ color: muted }}
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className="p-6 sm:p-7">
                {!success ? (
                  <>
                    {/* Header */}
                    <div className="flex flex-col items-start gap-1 mb-5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: accent }} />
                        <span
                          className="font-mono text-[9px] tracking-[0.3em] uppercase"
                          style={{ color: accent }}
                        >
                          MEMBERS CLUB
                        </span>
                      </div>
                      <h2
                        className="font-mono text-sm font-bold tracking-wider mt-1"
                        style={{ color: fg }}
                      >
                        GET 20% OFF YOUR FIRST ORDER
                      </h2>
                      <p
                        className="font-mono text-[10px] tracking-wider leading-relaxed mt-1"
                        style={{ color: muted }}
                      >
                        Join the private club. Get exclusive drops, restock
                        alerts, and member-only pricing.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail
                          size={12}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: muted }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="EMAIL ADDRESS"
                          className="w-full bg-transparent border pl-9 pr-4 py-3 font-mono text-[10px] tracking-[0.15em] outline-none transition-colors"
                          style={{
                            borderColor: border,
                            color: fg,
                          }}
                        />
                      </div>

                      <div className="relative">
                        <Phone
                          size={12}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: muted }}
                        />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="PHONE NUMBER (OPTIONAL)"
                          className="w-full bg-transparent border pl-9 pr-4 py-3 font-mono text-[10px] tracking-[0.15em] outline-none transition-colors"
                          style={{
                            borderColor: border,
                            color: fg,
                          }}
                        />
                      </div>

                      {error && (
                        <p className="font-mono text-[9px] tracking-wider text-red-400">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 font-mono text-[10px] tracking-[0.2em] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ background: accent, color: accentFg }}
                      >
                        {submitting ? "JOINING..." : "CLAIM 20% OFF →"}
                      </button>

                      <p
                        className="font-mono text-[8px] tracking-wider text-center"
                        style={{ color: muted }}
                      >
                        No spam. Unsubscribe anytime.
                      </p>
                    </form>
                  </>
                ) : (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 py-2 text-center"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: accentGlow }}
                    >
                      <Sparkles size={20} style={{ color: accent }} />
                    </div>
                    <div>
                      <h2
                        className="font-mono text-sm font-bold tracking-wider"
                        style={{ color: fg }}
                      >
                        YOU&apos;RE IN. 🔥
                      </h2>
                      <p
                        className="font-mono text-[10px] tracking-wider mt-1"
                        style={{ color: muted }}
                      >
                        Your exclusive code:
                      </p>
                    </div>

                    {/* Promo Code Display */}
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-3 border px-5 py-3 transition-all active:scale-95 w-full justify-center"
                      style={{
                        borderColor: accent,
                        background: accentGlow,
                      }}
                    >
                      <span
                        className="font-mono text-base font-bold tracking-[0.3em]"
                        style={{ color: accent }}
                      >
                        {promoCode}
                      </span>
                      {copied ? (
                        <Check size={14} style={{ color: accent }} />
                      ) : (
                        <Copy size={14} style={{ color: muted }} />
                      )}
                    </button>

                    <p
                      className="font-mono text-[9px] tracking-wider"
                      style={{ color: muted }}
                    >
                      {copied ? "COPIED!" : "TAP TO COPY"} · 20% off your first order
                    </p>

                    <button
                      onClick={() => setOpen(false)}
                      className="w-full py-3 font-mono text-[10px] tracking-[0.2em] border transition-all active:scale-[0.98]"
                      style={{ borderColor: border, color: fg }}
                    >
                      SHOP NOW →
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
