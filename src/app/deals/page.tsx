"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { fetchPromoCodes } from "@/lib/community";
import {
  Ticket, Copy, Check, Zap, Tag, Clock, AlertCircle, RefreshCw,
} from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_pct: number;
  one_time: boolean;
  active: boolean;
  max_uses: number | null;
  expires_at: string | null;
  min_order_amount: number | null;
  usage_count?: number;
  created_at: string;
}

export default function DealsPage() {
  const { fg, border, isDark, cardBg, muted, accent, accentFg } = useTheme();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchPromoCodes()
      .then((data: PromoCode[]) => {
        // Only show active codes that haven't expired
        const now = new Date();
        const active = data.filter(
          (p) => p.active && (!p.expires_at || new Date(p.expires_at) > now)
        );
        setPromos(active);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const daysLeft = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    return Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="pt-6 pb-5 mb-6" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Ticket size={14} style={{ color: accent }} />
              <h1
                className="font-mono text-sm tracking-[0.3em] uppercase font-bold"
                style={{ color: fg }}
              >
                DEALS & PROMOS
              </h1>
            </div>
            <p className="font-mono text-[11px] leading-relaxed" style={{ color: muted }}>
              Active codes · Apply at checkout · Updated regularly
            </p>
          </div>
          <button
            onClick={load}
            className="p-2 border hover:opacity-70 transition-opacity"
            style={{ borderColor: border, color: muted }}
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${muted}40`, borderTopColor: muted }}
          />
        </div>
      ) : promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle size={28} style={{ color: muted }} />
          <p
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: muted }}
          >
            No active deals right now
          </p>
          <p className="font-mono text-[9px]" style={{ color: muted }}>
            Check back soon — promo codes are added regularly
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo, i) => {
            const isCopied = copiedId === promo.id;
            const dl = daysLeft(promo.expires_at);
            const usagePct =
              promo.max_uses && (promo.usage_count || 0) > 0
                ? Math.round(((promo.usage_count || 0) / promo.max_uses) * 100)
                : null;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="border overflow-hidden flex flex-col"
                style={{ borderColor: border, background: cardBg }}
              >
                {/* Discount banner */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{
                    background: `${accent}15`,
                    borderBottom: `1px solid ${accent}25`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={12} style={{ color: accent }} />
                    <span
                      className="font-mono text-sm font-black tracking-widest"
                      style={{ color: accent }}
                    >
                      {promo.discount_pct}% OFF
                    </span>
                  </div>
                  {promo.one_time && (
                    <span
                      className="font-mono text-[7px] tracking-wider px-1.5 py-0.5"
                      style={{ background: `${accent}25`, color: accent }}
                    >
                      ONE-TIME
                    </span>
                  )}
                </div>

                {/* Code + Copy */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <button
                    onClick={() => copyCode(promo.code, promo.id)}
                    className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{
                      borderColor: isCopied ? "rgb(34,197,94)" : border,
                      background: isCopied ? "rgba(34,197,94,0.08)" : "transparent",
                    }}
                  >
                    <span
                      className="font-mono text-base font-black tracking-[0.3em]"
                      style={{ color: isCopied ? "rgb(34,197,94)" : fg }}
                    >
                      {promo.code}
                    </span>
                    <AnimatePresence mode="wait">
                      {isCopied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check size={16} className="text-green-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy size={14} style={{ color: muted }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Details */}
                  <div className="space-y-1.5 flex-1">
                    {promo.min_order_amount ? (
                      <div className="flex items-center gap-1.5">
                        <Tag size={9} style={{ color: muted }} />
                        <span className="font-mono text-[9px]" style={{ color: muted }}>
                          Min. order ${promo.min_order_amount}
                        </span>
                      </div>
                    ) : null}

                    {promo.max_uses ? (
                      <div className="flex items-center gap-1.5">
                        <Tag size={9} style={{ color: muted }} />
                        <span className="font-mono text-[9px]" style={{ color: muted }}>
                          {promo.usage_count || 0} / {promo.max_uses} used
                          {usagePct !== null && usagePct >= 80 && (
                            <span className="ml-1 text-yellow-400">· ALMOST GONE</span>
                          )}
                        </span>
                      </div>
                    ) : null}

                    {dl !== null ? (
                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={9}
                          style={{ color: dl <= 3 ? "rgb(239,68,68)" : muted }}
                        />
                        <span
                          className="font-mono text-[9px]"
                          style={{ color: dl <= 3 ? "rgb(239,68,68)" : muted }}
                        >
                          {dl <= 0
                            ? "Expires today"
                            : `Expires in ${dl} day${dl !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock size={9} style={{ color: muted }} />
                        <span className="font-mono text-[9px]" style={{ color: muted }}>
                          No expiry
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA hint */}
                  <p
                    className="font-mono text-[8px] tracking-wider text-center pt-1"
                    style={{ color: `${muted}70` }}
                  >
                    TAP TO COPY · APPLY AT CHECKOUT
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && promos.length > 0 && (
        <div className="mt-8 mb-4 text-center">
          <p className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
            {promos.length} ACTIVE CODE{promos.length !== 1 ? "S" : ""} · DEALS
            UPDATE REGULARLY
          </p>
        </div>
      )}
    </AppShell>
  );
}
