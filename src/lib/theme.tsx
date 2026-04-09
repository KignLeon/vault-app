"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ---- COLOR PROFILES (21st.dev-inspired dynamic themes) ----
export interface ColorProfile {
  name: string;
  hue: number;
  saturation: number;
  hue2: number;        // secondary hue for gradient accents
  saturation2: number;
  emoji: string;
}

export const COLOR_PROFILES: ColorProfile[] = [
  { name: "Crimson",    hue: 0,   saturation: 78,  hue2: 350, saturation2: 65, emoji: "🔴" },
  { name: "Midnight",   hue: 220, saturation: 70,  hue2: 250, saturation2: 60, emoji: "🌙" },
  { name: "Sunset",     hue: 25,  saturation: 90,  hue2: 350, saturation2: 75, emoji: "🌅" },
  { name: "Ocean",      hue: 195, saturation: 85,  hue2: 210, saturation2: 70, emoji: "🌊" },
  { name: "Bubblegum",  hue: 325, saturation: 75,  hue2: 290, saturation2: 60, emoji: "🍬" },
  { name: "Amber",      hue: 38,  saturation: 92,  hue2: 28,  saturation2: 85, emoji: "✨" },
  { name: "Amethyst",   hue: 270, saturation: 55,  hue2: 290, saturation2: 45, emoji: "💎" },
  { name: "Forest",     hue: 145, saturation: 70,  hue2: 160, saturation2: 55, emoji: "🌲" },
  { name: "Rosewater",  hue: 345, saturation: 50,  hue2: 10,  saturation2: 40, emoji: "🌷" },
  { name: "Neon",       hue: 265, saturation: 85,  hue2: 180, saturation2: 80, emoji: "⚡" },
  { name: "Carbon",     hue: 0,   saturation: 0,   hue2: 0,   saturation2: 0,  emoji: "🖤" },
];

const DEFAULT_PROFILE = COLOR_PROFILES[0]; // Crimson (red for user side)

// ---- WCAG CONTRAST UTILITIES ----
// Converts HSL → approximate sRGB → relative luminance for WCAG contrast checks

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return [r1 + m, g1 + m, b1 + m];
}

function srgbLuminance(r: number, g: number, b: number): number {
  const linearize = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function hslLuminance(h: number, s: number, l: number): number {
  const [r, g, b] = hslToRgb(h, s, l);
  return srgbLuminance(r, g, b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns '#000' or '#fff' — whichever has better contrast against the given HSL color */
function bestTextColor(h: number, s: number, l: number): string {
  const lum = hslLuminance(h, s, l);
  const contrastBlack = contrastRatio(lum, 0);    // black luminance ≈ 0
  const contrastWhite = contrastRatio(lum, 1);    // white luminance ≈ 1
  return contrastBlack > contrastWhite ? "#000" : "#fff";
}

// ---- CONTEXT ----
interface ThemeContextType {
  brightness: number;
  setBrightness: (v: number) => void;
  isDark: boolean;
  bg: string;
  fg: string;
  border: string;
  muted: string;
  cardBg: string;
  // Accent system
  accent: string;
  accentMuted: string;
  accentGlow: string;
  accentFg: string;          // best-contrast text color ON accent bg
  accentGradient: string;
  accentGradientFg: string;  // best-contrast text color ON gradient midpoint
  surfaceAccent: string;     // semi-transparent accent safe for tinted surfaces
  surfaceAccentFg: string;   // readable text on surfaceAccent
  colorProfile: ColorProfile;
  setColorProfile: (profileName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ---- STORAGE KEYS ----
const BRIGHTNESS_KEY = "gc247_brightness";
const PROFILE_KEY = "gc247_color_profile";

export function ThemeProvider({ children, defaultBrightness = 0 }: { children: React.ReactNode; defaultBrightness?: number }) {
  const [brightness, setBrightnessState] = useState(defaultBrightness);
  const [colorProfile, setColorProfileState] = useState<ColorProfile>(DEFAULT_PROFILE);
  const [mounted, setMounted] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const savedBrightness = localStorage.getItem(BRIGHTNESS_KEY);
      if (savedBrightness !== null) {
        setBrightnessState(Math.max(0, Math.min(100, Number(savedBrightness))));
      }
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const found = COLOR_PROFILES.find((p) => p.name === savedProfile);
        if (found) setColorProfileState(found);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setBrightness = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setBrightnessState(clamped);
    try { localStorage.setItem(BRIGHTNESS_KEY, String(clamped)); } catch {}
  }, []);

  const setColorProfile = useCallback((profileName: string) => {
    const found = COLOR_PROFILES.find((p) => p.name === profileName);
    if (found) {
      setColorProfileState(found);
      try { localStorage.setItem(PROFILE_KEY, found.name); } catch {}
    }
  }, []);

  // 100 = full white, 0 = full black
  const isDark = brightness < 50;
  const t = brightness / 100; // 0-1

  // Interpolate base colors
  const bgL = Math.round(t * 100);
  const fgL = Math.round((1 - t) * 100);
  const borderL = isDark ? Math.round(bgL + 20) : Math.round(bgL - 12);
  const mutedL = isDark ? Math.round(fgL * 0.7) : Math.round(fgL * 0.45 + 35);
  const cardL = isDark ? Math.round(bgL + 6) : Math.round(bgL - 3);

  const bg = `hsl(0, 0%, ${bgL}%)`;
  const fg = `hsl(0, 0%, ${fgL}%)`;
  const border = `hsl(0, 0%, ${Math.max(0, Math.min(100, borderL))}%)`;
  const muted = `hsl(0, 0%, ${Math.max(0, Math.min(100, mutedL))}%)`;
  const cardBg = `hsl(0, 0%, ${Math.max(0, Math.min(100, cardL))}%)`;

  // ---- ACCENT SYSTEM (brightness + hue aware) ----
  const { hue, saturation, hue2, saturation2 } = colorProfile;
  const isNeutral = saturation === 0; // Carbon theme

  // Accent lightness adapts to theme brightness for contrast
  // At low brightness → lighter accents; at high brightness → darker accents
  const accentL = isDark
    ? Math.max(50, 62 - Math.floor((50 - brightness) * 0.15))
    : Math.min(50, 45 + Math.floor((brightness - 50) * 0.1));

  const accentMutedL = isDark ? 35 : 70;
  const accentGlowOpacity = isDark ? 0.25 : 0.15;

  const accent = isNeutral
    ? (isDark ? 'hsl(0, 0%, 65%)' : 'hsl(0, 0%, 35%)')
    : `hsl(${hue}, ${saturation}%, ${accentL}%)`;

  const accentMuted = isNeutral
    ? (isDark ? 'hsl(0, 0%, 40%)' : 'hsl(0, 0%, 60%)')
    : `hsl(${hue}, ${Math.round(saturation * 0.6)}%, ${accentMutedL}%)`;

  const accentGlow = isNeutral
    ? `hsla(0, 0%, ${isDark ? 65 : 35}%, ${accentGlowOpacity})`
    : `hsla(${hue}, ${saturation}%, ${accentL}%, ${accentGlowOpacity})`;

  // Gradient accent using both hues for dynamic UI (buttons, badges, etc.)
  const accentGradient = isNeutral
    ? (isDark ? 'linear-gradient(135deg, hsl(0,0%,50%), hsl(0,0%,70%))' : 'linear-gradient(135deg, hsl(0,0%,30%), hsl(0,0%,45%))')
    : `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${accentL}%), hsl(${hue2}, ${saturation2}%, ${accentL}%))`;

  // ---- BRIGHTNESS-AWARE FOREGROUND ON ACCENT ----
  // Computes the actual best-contrast text color using WCAG luminance
  const accentFg = isNeutral
    ? bestTextColor(0, 0, isDark ? 65 : 35)
    : bestTextColor(hue, saturation, accentL);

  // Gradient midpoint contrast
  const midHue = Math.round((hue + hue2) / 2);
  const midSat = Math.round((saturation + saturation2) / 2);
  const accentGradientFg = isNeutral
    ? bestTextColor(0, 0, isDark ? 60 : 38)
    : bestTextColor(midHue, midSat, accentL);

  // ---- SURFACE ACCENT (tinted surface that preserves text readability) ----
  // Uses low alpha so the bg color shows through, keeping text readable
  const surfaceAlpha = isDark ? 0.12 : 0.08;
  const surfaceAccent = isNeutral
    ? `hsla(0, 0%, ${isDark ? 65 : 35}%, ${surfaceAlpha})`
    : `hsla(${hue}, ${saturation}%, ${accentL}%, ${surfaceAlpha})`;

  // Text on surface accent is just the regular fg — the tint is too subtle to break contrast
  const surfaceAccentFg = fg;

  return (
    <ThemeContext.Provider value={{
      brightness, setBrightness, isDark,
      bg, fg, border, muted, cardBg,
      accent, accentMuted, accentGlow, accentFg, accentGradient, accentGradientFg,
      surfaceAccent, surfaceAccentFg,
      colorProfile, setColorProfile,
    }}>
      <div
        style={{
          background: bg,
          color: fg,
          transition: "background 0.3s ease, color 0.3s ease",
          minHeight: "100dvh",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
