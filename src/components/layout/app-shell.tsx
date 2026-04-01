"use client";

import { GasclubNav } from "@/components/ui/gasclub-nav";
import { CartDrawer } from "@/components/ui/cart-drawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] transition-colors duration-300">
      <GasclubNav />
      <main className="w-full max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-16">
        {children}
      </main>
      <CartDrawer />
    </div>
  );
}
