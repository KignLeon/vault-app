"use client";

import React from "react";

// ── Main wordmark logo using the actual gasclub247 brand asset ─────────────────
// Uses the transparent PNG. Inverts automatically for dark/light mode via CSS filter.
export function GasclubWordmark({
  className = "",
  accentColor,
  size = "normal",
}: {
  className?: string;
  accentColor?: string;
  size?: "small" | "normal" | "large";
}) {
  const heights: Record<string, number> = { small: 32, normal: 44, large: 56 };
  const h = heights[size] || 44;

  return (
    <span className={`inline-block ${className}`} style={{ height: h }}>
      <img
        src="/gasclub247-logo.png"
        alt="GASCLUB247"
        style={{
          height: h,
          width: "auto",
          filter: "none",
        }}
        className="gasclub-logo-img"
      />
    </span>
  );
}

// ── Icon-only logo mark (the G circle — used as favicon / icon context) ────────
export function GasclubLogo({
  className = "",
  size = 32,
  style,
  accentColor,
}: {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  accentColor?: string;
}) {
  return (
    <span className={`inline-block ${className}`} style={{ height: size, ...style }}>
      <img
        src="/gasclub247-logo.png"
        alt="GASCLUB247"
        style={{ height: size, width: "auto" }}
        className="gasclub-logo-img"
      />
    </span>
  );
}

// ── Navbar wordmark — HUGE, dominant, fills the branding area ────────────────
// Uses continuous brightness level for smooth inversion instead of binary isDark
export function GasclubNavLogo({
  isDark,
  brightness,
  className = "",
}: {
  isDark: boolean;
  brightness?: number;
  className?: string;
}) {
  // Continuous inversion: at brightness=0 fully invert, at 100 no invert
  const invertAmount = brightness !== undefined
    ? Math.max(0, Math.min(1, 1 - brightness / 100))
    : (isDark ? 1 : 0);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/gasclub247-logo.png"
        alt="GASCLUB247"
        style={{
          height: 86,  // MASSIVELY scaled up — dominant in the navbar
          width: "auto",
          filter: `invert(${invertAmount})`,
          transition: "filter 0.3s ease",
          marginLeft: "-8px", // Pull it slightly left to balance the visual weight
        }}
        className="gasclub-nav-logo-img"
      />
    </span>
  );
}

// ── Footer logo — medium size, brightness-adaptive ──────────────────────────
export function GasclubFooterLogo({
  isDark,
  brightness,
  className = "",
}: {
  isDark: boolean;
  brightness?: number;
  className?: string;
}) {
  const invertAmount = brightness !== undefined
    ? Math.max(0, Math.min(1, 1 - brightness / 100))
    : (isDark ? 1 : 0);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/gasclub247-logo.png"
        alt="GASCLUB247"
        style={{
          height: 36,
          width: "auto",
          filter: `invert(${invertAmount})`,
          transition: "filter 0.3s ease",
          opacity: 0.7,
        }}
        className="gasclub-logo-img"
      />
    </span>
  );
}
