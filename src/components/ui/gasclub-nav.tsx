"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GasclubNavLogo } from "./gasclub-logo";
import { cn } from "@/lib/utils";
import { Home, Package, ShoppingCart, Shield, Ticket, Sun, Moon, ShoppingBag, Settings, LogOut, Check, Palette } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { useAuth } from "@/lib/auth";
import { useTheme, COLOR_PROFILES } from "@/lib/theme";
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

export function GasclubNav() {
  const pathname = usePathname();
  const { isAdmin, user, logout } = useAuth();
  const { brightness, setBrightness, isDark, fg, border, bg, muted, accent, accentMuted, accentGlow, accentFg, colorProfile, setColorProfile } = useTheme();
  const { itemCount, setCartOpen } = useCart();
  const [showPanel, setShowPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 rounded-full transition-all active:scale-90 nav-action-btn"
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
                      onClick={() => { logout(); setShowUserMenu(false); }}
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

      {/* Theme + Color Picker Panel — full-width on mobile */}
      {showPanel && (
        <>
          <div className="fixed inset-0 z-[97]" onClick={() => setShowPanel(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-[92px] right-4 z-[98] w-[340px] border p-5 theme-panel-mobile shadow-2xl"
            style={{
              background: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.98)",
              borderColor: border,
            }}
          >
            {/* Two columns: Brightness + Color Picker */}
            <div className="flex gap-5">
              {/* Left: Brightness */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[9px] tracking-[0.2em] mb-3" style={{ color: fg, opacity: 0.5 }}>
                  BRIGHTNESS
                </p>
                <div className="flex items-center gap-3">
                  <Moon size={12} style={{ color: muted, flexShrink: 0 }} />
                  <Slider
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <Sun size={12} style={{ color: muted, flexShrink: 0 }} />
                </div>
                <p className="font-mono text-[9px] tracking-wider mt-2 text-center" style={{ color: fg, opacity: 0.3 }}>
                  {brightness}%
                </p>
              </div>

              {/* Divider */}
              <div className="w-px" style={{ background: border }} />

              {/* Right: Color Profiles */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[9px] tracking-[0.2em] mb-3" style={{ color: fg, opacity: 0.5 }}>
                  THEME
                </p>
                <div className="grid grid-cols-5 gap-1.5">
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
                        className="flex flex-col items-center gap-1 p-1 rounded transition-all active:scale-90"
                        style={{
                          background: isActive
                            ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)")
                            : "transparent",
                        }}
                        title={profile.name}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
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
                          className="font-mono text-[6px] tracking-wider leading-none truncate w-full text-center"
                          style={{ color: isActive ? fg : muted }}
                        >
                          {profile.name.toUpperCase().slice(0, 7)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active profile label */}
            <div
              className="mt-4 pt-3 flex items-center justify-center gap-2"
              style={{ borderTop: `1px solid ${border}` }}
            >
              <span className="text-sm">{colorProfile.emoji}</span>
              <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: accent }}>
                {colorProfile.name.toUpperCase()}
              </span>
            </div>
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
