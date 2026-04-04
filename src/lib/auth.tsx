"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Simple passcode-based auth — no user accounts ─────────────────────────────
// Site access: GC247
// Admin access: verified server-side via /api/admin/verify

export type UserRole = "guest" | "member" | "admin";

export interface VaultUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatar: string;
  createdAt: string;
  purchaseCount: number;
}

interface AuthContextType {
  user: VaultUser | null;
  session: null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canComment: boolean;
  loading: boolean;
  signup: (username: string, password: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (passkey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<VaultUser, "displayName" | "avatar" | "email">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Generic anonymous user for checkout (no login needed)
const ANON_USER: VaultUser = {
  id: "anon",
  username: "member",
  displayName: "Member",
  email: "",
  role: "member",
  avatar: "",
  createdAt: new Date().toISOString(),
  purchaseCount: 0,
};

const ADMIN_USER: VaultUser = {
  id: "admin",
  username: "admin",
  displayName: "Admin",
  email: "admin@gasclub247.com",
  role: "admin",
  avatar: "",
  createdAt: new Date().toISOString(),
  purchaseCount: 0,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VaultUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check localStorage for existing access
  useEffect(() => {
    try {
      const hasAccess = localStorage.getItem("gc247_access") === "true";
      const isAdmin = localStorage.getItem("gc247_admin") === "true";
      if (hasAccess) {
        setUser(isAdmin ? ADMIN_USER : ANON_USER);
      }
    } catch {}
    setLoading(false);
  }, []);

  // Site passcode check (GC247)
  const login = useCallback(async (username: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    if (username.trim().toUpperCase() === "GC247") {
      try { localStorage.setItem("gc247_access", "true"); } catch {}
      setUser(ANON_USER);
      return { success: true };
    }
    return { success: false, error: "Invalid access code" };
  }, []);

  // Signup is disabled — just use the passcode
  const signup = useCallback(async (_username: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: "Account creation disabled. Use the site access code." };
  }, []);

  // Admin login — server-side only, no client-side secrets
  const adminLogin = useCallback(async (passkey: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = passkey.trim();

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.session?.access_token) {
          try { localStorage.setItem("gc247_session", JSON.stringify(data.session)); } catch {}
        }
        try { localStorage.setItem("gc247_access", "true"); localStorage.setItem("gc247_admin", "true"); } catch {}
        setUser(ADMIN_USER);
        return { success: true };
      }
      return { success: false, error: data.error || "INVALID PASSKEY" };
    } catch {
      return { success: false, error: "CONNECTION ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem("gc247_access");
      localStorage.removeItem("gc247_admin");
    } catch {}
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<VaultUser, "displayName" | "avatar" | "email">>) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin: isAdmin,
        canComment: isAdmin,
        loading,
        signup,
        login,
        adminLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
