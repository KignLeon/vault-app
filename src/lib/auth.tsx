"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ---- ROLES ----
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
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canComment: boolean;
  signup: (username: string, password: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (passkey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<VaultUser, "displayName" | "avatar" | "email">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function makeSyntheticEmail(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@vault.local`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VaultUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchProfile = async (authUserId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        email: data.email,
        role: data.role as UserRole,
        avatar: data.avatar,
        createdAt: data.created_at,
        purchaseCount: data.purchase_count
      });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoaded(true));
      } else {
        setLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup = useCallback(async (username: string, password: string, avatar?: string): Promise<{ success: boolean; error?: string }> => {
    const trimUser = username.trim().toLowerCase();
    if (!trimUser || trimUser.length < 3) return { success: false, error: "Username must be at least 3 characters" };
    if (!password || password.length < 4) return { success: false, error: "Password must be at least 4 characters" };

    const email = makeSyntheticEmail(trimUser);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: trimUser,
          display_name: username.trim(),
          avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${trimUser}&backgroundColor=0a0a0a&textColor=ffffff`,
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimUser = username.trim().toLowerCase();
    const email = makeSyntheticEmail(trimUser);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: "Invalid username or password" };
    return { success: true };
  }, []);

  const adminLogin = useCallback(async (passkey: string): Promise<{ success: boolean; error?: string }> => {
    // If we wanted real admin auth, we'd sign in to a specific admin email.
    // For now we map the passkey to the admin's email and password.
    const { error } = await supabase.auth.signInWithPassword({
      email: 'admin@vault.local',
      password: passkey
    });

    if (error) {
      return { success: false, error: "Invalid passkey" };
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<VaultUser, "displayName" | "avatar" | "email">>) => {
    if (!user) return;
    
    // Convert keys from DB standard
    const payload: any = {};
    if (updates.displayName) payload.display_name = updates.displayName;
    if (updates.avatar) payload.avatar = updates.avatar;
    if (updates.email) payload.email = updates.email;

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', user.id);
      
    if (!error) {
      await fetchProfile(user.id);
    }
  }, [user]);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const canComment = user?.role === "approved_buyer" || isAdmin;

  if (!loaded) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, isSuperAdmin, canComment, signup, login, adminLogin, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
