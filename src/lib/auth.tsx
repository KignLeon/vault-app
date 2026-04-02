"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { DbProfile } from "@/lib/supabase-types";

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = "guest" | "member" | "approved_buyer" | "admin" | "super_admin";

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
  session: Session | null;
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

// Convert Supabase profile to VaultUser shape
function profileToVaultUser(profile: DbProfile): VaultUser {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    email: profile.email || "",
    role: profile.role as UserRole,
    avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}&backgroundColor=0a0a0a&textColor=ffffff`,
    createdAt: profile.created_at,
    purchaseCount: profile.purchase_count,
  };
}

// Fetch profile from DB
async function fetchProfile(userId: string): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VaultUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: restore session from Supabase
  useEffect(() => {
    let resolved = false;

    // Timeout safety — never block the app for more than 2s
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("[Auth] Session restore timed out — continuing as guest");
        setLoading(false);
      }
    }, 2000);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (resolved) return; // timeout already fired
      resolved = true;
      clearTimeout(timeout);
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profileToVaultUser(profile));
      }
      setLoading(false);
    }).catch(() => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      console.warn("[Auth] Session restore failed — continuing as guest");
      setLoading(false);
    });

    // Subscribe to auth state changes (handles OAuth, magic links, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) setUser(profileToVaultUser(profile));
          else setUser(null);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (
    username: string,
    password: string,
    avatar?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimUser = username.trim().toLowerCase();

    if (!trimUser || trimUser.length < 3) return { success: false, error: "Username must be at least 3 characters" };
    if (!password || password.length < 4) return { success: false, error: "Password must be at least 4 characters" };

    // Check username uniqueness before creating account
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimUser)
      .maybeSingle();

    if (existing) return { success: false, error: "Username already taken" };

    // Use username@gasclub247.app as internal email to satisfy Supabase auth
    const email = `${trimUser}@gasclub247.app`;
    const avatarUrl = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${trimUser}&backgroundColor=0a0a0a&textColor=ffffff`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: trimUser,
          display_name: username.trim(),
          avatar_url: avatarUrl,
        },
        // Skip email confirmation for MVP
        emailRedirectTo: undefined,
      },
    });

    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Failed to create account" };

    // Upsert profile (trigger should handle it, but be safe)
    await (supabase as any).from("profiles").upsert({
      id: data.user.id,
      username: trimUser,
      display_name: username.trim(),
      email: "",
      avatar_url: avatarUrl,
      role: "member",
    });

    return { success: true };
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimUser = username.trim().toLowerCase();

    // Reconstruct the internal email
    const email = `${trimUser}@gasclub247.app`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Friendly error messages
      if (error.message.includes("Invalid login")) return { success: false, error: "Incorrect username or password" };
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  // ── ADMIN LOGIN (secure — passkey verified server-side) ─────────────────
  const adminLogin = useCallback(async (
    passkey: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkey.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error || "Invalid passkey" };
      }

      // Set the session returned from the server
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: "Connection failed — try again" };
    }
  }, []);

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (
    updates: Partial<Pick<VaultUser, "displayName" | "avatar" | "email">>
  ) => {
    if (!user) return;
    const { error } = await (supabase as any).from("profiles").update({
      ...(updates.displayName ? { display_name: updates.displayName } : {}),
      ...(updates.avatar ? { avatar_url: updates.avatar } : {}),
      ...(updates.email ? { email: updates.email } : {}),
    }).eq("id", user.id);

    if (!error) {
      setUser((prev) => prev ? {
        ...prev,
        ...(updates.displayName ? { displayName: updates.displayName } : {}),
        ...(updates.avatar ? { avatar: updates.avatar } : {}),
        ...(updates.email ? { email: updates.email } : {}),
      } : null);
    }
  }, [user]);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const canComment = user?.role === "approved_buyer" || isAdmin;

  // Prevent flash — show spinner while restoring session
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        canComment,
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
