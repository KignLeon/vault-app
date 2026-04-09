"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GasclubNavLogo } from "./gasclub-logo";
import { cn } from "@/lib/utils";
import { Home, Package, ShoppingCart, Shield, Sun, Moon, ShoppingBag, LogOut, Check, Palette, X, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme, COLOR_PROFILES } from "@/lib/theme";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/lib/cart";
import { LeadCaptureModal } from "./lead-capture-modal";

function getTabs(isAdmin: boolean) {
  const tabs = [
    { label: "FEED", href: "/home", icon: Home },
    { label: "INVENTORY", href: "/inventory", icon: Package },
    { label: "ORDERS", href: "/orders", icon: ShoppingCart },
    { label: "SETTINGS", href: "/settings", icon: Settings },
  ];
  if (isAdmin) {
    tabs.push({ label: "ADMIN", href: "/admin", icon: Shield });
  }
  return tabs;
}

export function GasclubNav() {
  const pathname = usePathname();
  const { isAdmin, user, logout } = useAuth();
  const { brightness, setBrightness, isDark, fg, border, bg, muted, accent, accentMuted, accentGlow, accentFg, colorProfile, setColorProfile } = useTheme();
  const { itemCount, setCartOpen } = useCart();
  const [showPanel, setShowPanel] = useState(false);
  const tabs = getTabs(isAdmin);

  return (
    <>
      {/* Top Bar — taller to accommodate huge logo */}
      <nav
        className="fixed top-0 left-0 z-[99] flex min-h-[88px] w-full items-center justify-between px-3 sm:px-6 backdrop-blur-md transition-colors duration-300"
        style={{
          background: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        {/* Logo — fills the branding area with minimal padding */}
        <Link href="/home" className="flex items-center py-2 -my-2 overflow-visible">
          <GasclubNavLogo isDark={isDark} brightness={brightness} />
        </Link>

        {/* Action buttons — tighter on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 nav-actions">
          {/* Theme + Color Toggle */}
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="p-2 rounded-full transition-all active:scale-90 nav-action-btn"
            style={{ color: fg }}
            aria-label="Adjust theme & color"
          >
            {showPanel ? <Palette size={15} /> : isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-full transition-all active:scale-90 nav-action-btn"
            style={{ color: fg }}
            aria-label="Cart"
          >
            <ShoppingBag size={15} />
            {itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-mono text-[9px] font-bold"
                style={{ background: accent, color: accentFg }}
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Lead modal collapsed icon */}
          <LeadCaptureModal />

          {/* Logout — takes everyone back to entry screen */}
          <button
            onClick={() => { logout(); window.location.href = "/"; }}
            className="p-2 rounded-full transition-all active:scale-90 nav-action-btn"
            style={{ color: fg }}
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      {/* Theme + Color Panel — slides into nav bar filling space to the left */}
      <AnimatePresence>
        {showPanel && (
          <>
            <div className="fixed inset-0 z-[99]" onClick={() => setShowPanel(false)} />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 z-[100] min-h-[88px] flex items-center backdrop-blur-xl"
              style={{
                background: isDark ? "rgba(0,0,0,0.96)" : "rgba(255,255,255,0.98)",
                borderBottom: `1px solid ${border}`,
              }}
            >
              {/* Close / Logo area */}
              <button
                onClick={() => setShowPanel(false)}
                className="px-4 sm:px-6 h-full flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] flex-shrink-0 active:scale-95 transition-transform"
                style={{ color: muted }}
              >
                <Palette size={14} style={{ color: accent }} />
                <span className="hidden sm:inline">THEME</span>
              </button>

              {/* Divider */}
              <div className="w-px h-10" style={{ background: border }} />

              {/* Brightness control */}
              <div className="flex items-center gap-2 px-3 sm:px-4 flex-shrink-0">
                <Moon size={11} style={{ color: muted }} />
                <div className="w-20 sm:w-28">
                  <Slider
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Sun size={11} style={{ color: muted }} />
                <span className="font-mono text-[8px] tracking-wider w-7 text-center" style={{ color: muted }}>
                  {brightness}%
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-10" style={{ background: border }} />

              {/* Color swatches — fill remaining space */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 overflow-x-auto no-scroll-bar flex-1 min-w-0">
                {COLOR_PROFILES.map((profile) => {
                  const isActive = colorProfile.name === profile.name;
                  const isNeutral = profile.saturation === 0;
                  const l = isDark ? 55 : 45;
                  const swatchGrad = isNeutral
                    ? (isDark ? 'linear-gradient(135deg, hsl(0,0%,45%), hsl(0,0%,65%))' : 'linear-gradient(135deg, hsl(0,0%,30%), hsl(0,0%,50%))')
                    : `linear-gradient(135deg, hsl(${profile.hue}, ${profile.saturation}%, ${l}%), hsl(${profile.hue2}, ${profile.saturation2}%, ${l}%))`;
                  const glowColor = isNeutral
                    ? (isDark ? 'rgba(160,160,160,0.5)' : 'rgba(80,80,80,0.4)')
                    : `hsla(${profile.hue}, ${profile.saturation}%, ${l}%, 0.5)`;
                  return (
                    <button
                      key={profile.name}
                      onClick={() => setColorProfile(profile.name)}
                      className="flex flex-col items-center gap-0.5 p-1 rounded transition-all active:scale-90 flex-shrink-0"
                      style={{
                        background: isActive
                          ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")
                          : "transparent",
                      }}
                      title={profile.name}
                    >
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: swatchGrad,
                          boxShadow: isActive
                            ? `0 0 0 2px ${isDark ? '#fff' : '#000'}, 0 0 10px ${glowColor}`
                            : 'none',
                        }}
                      >
                        {isActive && (
                          <Check size={9} style={{ color: "#fff" }} />
                        )}
                      </div>
                      <span
                        className="font-mono text-[5px] sm:text-[6px] tracking-wider leading-none truncate w-full text-center"
                        style={{ color: isActive ? fg : muted }}
                      >
                        {profile.name.toUpperCase().slice(0, 6)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active theme label + close */}
              <div className="flex items-center gap-2 px-3 sm:px-5 flex-shrink-0">
                <span className="text-sm">{colorProfile.emoji}</span>
                <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.12em] hidden sm:inline" style={{ color: accent }}>
                  {colorProfile.name.toUpperCase()}
                </span>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1.5 active:scale-90 transition-transform ml-1"
                  style={{ color: fg }}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  style={{ color: isActive ? accent : `${fg}40` }}
                  className="transition-colors"
                />
                <span
                  className={cn(
                    "font-mono text-[8px] tracking-[0.15em] transition-colors",
                  )}
                  style={{ color: isActive ? accent : `${fg}30` }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/4 right-1/4 h-[2px]"
                    style={{ background: accent }}
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
