"use client";

import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Copy, ExternalLink, MessageCircle, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function InstructionsPage() {
  const { fg, border, isDark, cardBg, muted } = useTheme();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { num: "01", title: "ORDER PLACED", desc: "Your order has been created and assigned a unique order number." },
    { num: "02", title: "PAYMENT", desc: "Send payment via your preferred method. Include your order number as reference." },
    { num: "03", title: "CONFIRMATION", desc: "Contact us via Telegram or WhatsApp with your order number after payment." },
    { num: "04", title: "FULFILLMENT", desc: "We verify payment, prepare your order, and ship or arrange pickup." },
  ];

  const paymentMethods = [
    { name: "CRYPTO", details: "BTC, ETH, USDT — Wallet address provided after contact", icon: "₿" },
    { name: "ZELLE", details: "Instant bank transfer — Details provided via Telegram", icon: "Z" },
    { name: "BANK WIRE", details: "Direct wire transfer — Routing info provided after contact", icon: "$" },
  ];

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-6">
        {/* Header */}
        <div>
          <h1 className="font-mono text-sm tracking-[0.3em] font-bold uppercase" style={{ color: fg }}>
            PAYMENT INSTRUCTIONS
          </h1>
          <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: muted }}>
            How to complete your order after checkout
          </p>
        </div>

        {/* Order Number (if coming from checkout) */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border p-5 text-center"
            style={{ borderColor: fg, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)" }}
          >
            <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>YOUR ORDER NUMBER</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <p className="font-mono text-xl font-bold tracking-wider" style={{ color: fg }}>{orderId}</p>
              <button
                onClick={() => handleCopy(orderId)}
                className="p-1.5 border active:scale-90 transition-transform"
                style={{ borderColor: border, color: muted }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="font-mono text-[9px] tracking-wider mt-2" style={{ color: muted }}>
              Save this — you&apos;ll need it when you contact us
            </p>
          </motion.div>
        )}

        {/* Steps */}
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.2em] mb-4" style={{ color: muted }}>HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border p-4"
                style={{ borderColor: border, background: cardBg }}
              >
                <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: fg, opacity: 0.3 }}>{step.num}</span>
                <p className="font-mono text-xs font-bold tracking-wider mt-1" style={{ color: fg }}>{step.title}</p>
                <p className="font-mono text-[10px] leading-relaxed mt-1" style={{ color: muted }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.2em] mb-4" style={{ color: muted }}>ACCEPTED PAYMENT METHODS</h2>
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div key={pm.name} className="flex items-center gap-4 border p-4" style={{ borderColor: border, background: cardBg }}>
                <div className="w-10 h-10 flex items-center justify-center border font-mono text-xs font-bold" style={{ borderColor: border, color: fg }}>
                  {pm.icon}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-xs font-bold tracking-wider" style={{ color: fg }}>{pm.name}</p>
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>{pm.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="border p-5" style={{ borderColor: border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
          <h2 className="font-mono text-[10px] tracking-[0.2em] mb-3" style={{ color: muted }}>NEXT STEP: CONTACT US</h2>
          <p className="font-mono text-xs leading-relaxed" style={{ color: fg }}>
            After sending payment, message us with your <strong>order number</strong> and <strong>payment screenshot</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => window.open("https://t.me/")}
              className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-wider active:scale-95 transition-transform"
              style={{ background: fg, color: isDark ? "#000" : "#fff" }}
            >
              <MessageCircle size={12} /> TELEGRAM
            </button>
            <button
              onClick={() => window.open("https://wa.me/")}
              className="flex items-center gap-1.5 px-4 py-2.5 border font-mono text-[10px] tracking-wider active:scale-95 transition-transform"
              style={{ borderColor: border, color: fg }}
            >
              <ExternalLink size={12} /> WHATSAPP
            </button>
            <button
              onClick={() => window.open("sms:")}
              className="flex items-center gap-1.5 px-4 py-2.5 border font-mono text-[10px] tracking-wider active:scale-95 transition-transform"
              style={{ borderColor: border, color: fg }}
            >
              <MessageCircle size={12} /> TEXT
            </button>
          </div>
        </div>

        {/* Back to shop */}
        <Link href="/inventory" className="flex items-center gap-2 font-mono text-[10px] tracking-wider py-4 active:scale-95 transition-transform" style={{ color: muted }}>
          <ArrowRight size={12} className="rotate-180" /> BACK TO INVENTORY
        </Link>
      </motion.div>
    </AppShell>
  );
}
