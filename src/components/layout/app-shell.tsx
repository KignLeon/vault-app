"use client";

import { GasclubNav } from "@/components/ui/gasclub-nav";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { GasclubFooterLogo } from "@/components/ui/gasclub-logo";
import { ProductTicker } from "@/components/ui/product-ticker";
import { useTheme } from "@/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className="min-h-[100dvh] transition-colors duration-300">
      <GasclubNav />

      {/* Product Discovery Ticker — below nav (now 88px) */}
      <div className="fixed top-[88px] left-0 right-0 z-[98]">
        <ProductTicker />
      </div>

      {/* Main content — accounts for new nav (~96px) + ticker (~52px) */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-8 pt-[160px] pb-24 md:pb-16 flex-1 min-h-[100vh]">
        {children}
      </main>

      {/* Premium Branded Footer — GC247 × Lovoson Media */}
      <footer
        className="w-full pb-24 md:pb-12 pt-12"
        style={{ background: isDark ? "#000" : "#0a0a0a", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-8 px-4">
          {/* Logos — GC247 × Lovoson */}
          <div className="flex items-center gap-5">
            <GasclubFooterLogo isDark={true} />
            <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>×</span>
            <a
              href="https://lovoson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Lovoson"
            >
              <img
                src="/lovoson-icon.svg"
                alt="Lovoson"
                style={{ height: 32, width: "auto", filter: "invert(1)" }}
              />
            </a>
          </div>

          {/* Credit line */}
          <a
            href="https://lovoson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.25em] hover:opacity-100 transition-opacity"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            DESIGNED BY LOVOSON MEDIA
          </a>

          {/* Legal */}
          <p className="font-mono text-[8px] tracking-wider text-center" style={{ color: "rgba(255,255,255,0.18)" }}>
            © {new Date().getFullYear()} GASCLUB247. PRIVATE PLATFORM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
