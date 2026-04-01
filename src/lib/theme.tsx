"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ---- COLOR PROFILES ----
export interface ColorProfile {
  name: string;
  hue: number;
  saturation: number;
  emoji: string;
}

export const COLOR_PROFILES: ColorProfile[] = [
  { name: "Midnight", hue: 220, saturation: 60, emoji: "🌙" },
  { name: "Sunset", hue: 25, saturation: 85, emoji: "🌅" },
  { name: "Sakura", hue: 340, saturation: 65, emoji: "🌸" },
  { name: "Mizu", hue: 190, saturation: 70, emoji: "🌊" },
  { name: "Phantom", hue: 270, saturation: 50, emoji: "👻" },
  { name: "Cali", hue: 45, saturation: 90, emoji: "☀️" },
  { name: "Aurora", hue: 160, saturation: 65, emoji: "🌿" },
  { name: "Ember", hue: 5, saturation: 80, emoji: "🔥" },
];

const DEFAULT_PROFILE = COLOR_PROFILES[0]; // Midnight

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
  accentFg: string;
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

  // ---- ACCENT SYSTEM ----
  const { hue, saturation } = colorProfile;
  // Accent lightness adapts to theme brightness for contrast
  const accentL = isDark ? 62 : 45;
  const accentMutedL = isDark ? 35 : 70;
  const accentGlowOpacity = isDark ? 0.25 : 0.15;

  const accent = `hsl(${hue}, ${saturation}%, ${accentL}%)`;
  const accentMuted = `hsl(${hue}, ${saturation * 0.6}%, ${accentMutedL}%)`;
  const accentGlow = `hsla(${hue}, ${saturation}%, ${accentL}%, ${accentGlowOpacity})`;
  // Foreground for text on accent backgrounds
  const accentFg = isDark ? "#000" : "#fff";

  return (
    <ThemeContext.Provider value={{
      brightness, setBrightness, isDark,
      bg, fg, border, muted, cardBg,
      accent, accentMuted, accentGlow, accentFg,
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
