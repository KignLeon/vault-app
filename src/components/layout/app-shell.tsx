"use client";

import { GasclubNav } from "@/components/ui/gasclub-nav";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { GasclubFooterLogo } from "@/components/ui/gasclub-logo";
import { ProductTicker } from "@/components/ui/product-ticker";
import { useTheme } from "@/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { muted, border, isDark, brightness, fg } = useTheme();
  return (
    <div className="min-h-[100dvh] transition-colors duration-300">
      <GasclubNav />

      {/* Product Discovery Ticker — below nav (now 88px) */}
      <div className="fixed top-[88px] left-0 right-0 z-[98]">
        <ProductTicker />
      </div>

      {/* Main content — accounts for new nav (~88px) + ticker (~52px) */}
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-[160px] pb-24 md:pb-16 flex-1 min-h-[100vh]">
        {children}
      </main>

      {/* Premium Footer */}
      <footer
        className="w-full pb-20 md:pb-8 pt-8"
        style={{ borderTop: `1px solid ${border}` }}
      >
        <div className="flex flex-col items-center gap-4 px-4">
          {/* Logo */}
          <GasclubFooterLogo isDark={isDark} brightness={brightness} />

          {/* Divider */}
          <div
            className="w-16 h-px"
            style={{
              background: border,
              maskImage: "linear-gradient(to right, transparent, black, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black, transparent)",
            }}
          />

          {/* Designed by */}
          <a
            href="https://lovoson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
            style={{ color: muted, opacity: 0.6 }}
          >
            Designed by Lovoson Media
          </a>

          {/* Copyright */}
          <p
            className="font-mono text-[8px] tracking-[0.15em] uppercase"
            style={{ color: muted, opacity: 0.3 }}
          >
            © {new Date().getFullYear()} GASCLUB247 · ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
