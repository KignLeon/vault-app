"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Public site, admin-only auth ──────────────────────────────────────────────
// The site is fully public — no access code needed.
// Admin access is verified server-side via /api/admin/verify.
// Admin sessions use sessionStorage — closing the tab/browser requires re-auth.

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

// Generic anonymous user — always available (public site)
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

  // On mount: check sessionStorage for admin (tab-scoped, not persisted across browser close)
  useEffect(() => {
    try {
      const isAdmin = sessionStorage.getItem("gc247_admin") === "true";
      setUser(isAdmin ? ADMIN_USER : ANON_USER);
    } catch {
      // Fallback — always public
      setUser(ANON_USER);
    }
    setLoading(false);
  }, []);

  // Site passcode check — no longer needed, always grant access
  const login = useCallback(async (_username: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    setUser(ANON_USER);
    return { success: true };
  }, []);

  // Signup is disabled
  const signup = useCallback(async (_username: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: "Account creation disabled." };
  }, []);

  // Admin login — server-side only, no client-side secrets
  // Uses sessionStorage so admin must re-enter passkey every time they close the tab/browser
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
          try { sessionStorage.setItem("gc247_session", JSON.stringify(data.session)); } catch {}
        }
        try { sessionStorage.setItem("gc247_admin", "true"); } catch {}
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
      sessionStorage.removeItem("gc247_admin");
      sessionStorage.removeItem("gc247_session");
      // Also clean up any legacy localStorage values
      localStorage.removeItem("gc247_admin");
      localStorage.removeItem("gc247_session");
    } catch {}
    // After admin logout, user becomes public member again (not kicked out)
    setUser(ANON_USER);
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
