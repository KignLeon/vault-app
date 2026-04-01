"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VaultLogo } from "./vault-logo";
import { cn } from "@/lib/utils";
import { Home, Package, ShoppingCart, Shield, Ticket, Sun, Moon, ShoppingBag, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/lib/cart";

function getTabs(isAdmin: boolean) {
  return [
    { label: "FEED", href: "/home", icon: Home },
    { label: "INVENTORY", href: "/inventory", icon: Package },
    { label: "ORDERS", href: "/orders", icon: ShoppingCart },
    isAdmin
      ? { label: "ADMIN", href: "/admin", icon: Shield }
      : { label: "DEALS", href: "/deals", icon: Ticket },
  ];
}

export function VaultNav() {
  const pathname = usePathname();
  const { isAdmin, user, logout } = useAuth();
  const { brightness, setBrightness, isDark, fg, border, bg, cardBg } = useTheme();
  const { itemCount, setCartOpen } = useCart();
  const [showSlider, setShowSlider] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const tabs = getTabs(isAdmin);

  return (
    <>
      {/* Top Bar */}
      <nav
        className="fixed top-0 left-0 z-[99] flex h-14 w-full items-center justify-between px-4 backdrop-blur-md transition-colors duration-300"
        style={{
          background: isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Link href="/home" className="flex items-center gap-2">
          <VaultLogo size={24} className="transition-colors" style={{ color: fg }} />
          <span
            className="font-mono text-[10px] font-bold tracking-[0.3em] transition-colors"
            style={{ color: fg }}
          >
            VAULT
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setShowSlider(!showSlider)}
            className="p-2 rounded-full transition-all active:scale-90"
            style={{ color: fg }}
            aria-label="Adjust theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-full transition-all active:scale-90"
            style={{ color: fg }}
            aria-label="Cart"
          >
            <ShoppingBag size={15} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-mono text-[9px] font-bold" style={{ background: fg, color: isDark ? '#000' : '#fff' }}>
                {itemCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 rounded-full transition-all active:scale-90"
            style={{ color: fg }}
            aria-label="Settings"
          >
            <Settings size={15} />
          </Link>

          {/* User Avatar / Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="active:scale-90 transition-transform"
              >
                <Avatar className="h-7 w-7 border" style={{ borderColor: border }}>
                  <AvatarImage src={user.avatar} alt={user.displayName || user.username} />
                  <AvatarFallback className="text-[8px]">
                    {(user.displayName || user.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-[98]" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-10 z-[99] w-48 border p-2 space-y-1"
                    style={{ background: isDark ? "#0a0a0a" : "#fff", borderColor: border }}
                  >
                    <div className="px-3 py-2" style={{ borderBottom: `1px solid ${border}` }}>
                      <p className="font-mono text-[10px] font-bold tracking-wider truncate" style={{ color: fg }}>
                        @{user.username}
                      </p>
                      <p className="font-mono text-[8px] tracking-wider uppercase" style={{ color: fg, opacity: 0.4 }}>
                        {user.role.replace("_", " ")}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider transition-colors hover:bg-white/5"
                      style={{ color: fg }}
                    >
                      <Settings size={12} /> SETTINGS
                    </Link>
                    <button
                      onClick={async () => { await logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider transition-colors hover:bg-white/5 text-left"
                      style={{ color: fg }}
                    >
                      <LogOut size={12} /> SIGN OUT
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Brightness Slider Panel */}
      {showSlider && (
        <>
          <div className="fixed inset-0 z-[97]" onClick={() => setShowSlider(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-14 right-4 z-[98] w-64 border p-4"
            style={{
              background: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.98)",
              borderColor: border,
            }}
          >
            <p className="font-mono text-[9px] tracking-[0.2em] mb-3" style={{ color: fg, opacity: 0.5 }}>
              BRIGHTNESS
            </p>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={0}
              max={100}
              step={1}
            />
            <p className="font-mono text-[9px] tracking-wider mt-2 text-center" style={{ color: fg, opacity: 0.3 }}>
              {brightness}%
            </p>
          </motion.div>
        </>
      )}

      {/* Bottom Tabs */}
      <div
        className="fixed bottom-0 left-0 z-[99] w-full backdrop-blur-md transition-colors duration-300 safe-area-bottom"
        style={{
          background: isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
          borderTop: `1px solid ${border}`,
        }}
      >
        <div className="flex items-stretch h-14">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative active:bg-white/5"
              >
                <Icon
                  size={18}
                  style={{ color: isActive ? fg : `${fg}40` }}
                  className="transition-colors"
                />
                <span
                  className={cn(
                    "font-mono text-[8px] tracking-[0.15em] transition-colors",
                  )}
                  style={{ color: isActive ? fg : `${fg}30` }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/4 right-1/4 h-[2px]"
                    style={{ background: fg }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
