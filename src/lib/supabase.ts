import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

// ── Browser client (uses anon key) ────────────────────────────────────────────
// Lazy initialization — only throws if URL/key are missing when actually USED
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Singleton pattern for browser client
let _browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!_browserClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // During static build with missing env vars — return a dummy that fails gracefully
      _browserClient = createClient<Database>(
        "https://placeholder.supabase.co",
        "placeholder-anon-key"
      );
    } else {
      _browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
  }
  return _browserClient;
}

export const supabase = getSupabaseClient();

// ── Server-side client (uses service role key) ────────────────────────────────
// Only call from Server Components / API routes — NEVER ship to browser bundle
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
