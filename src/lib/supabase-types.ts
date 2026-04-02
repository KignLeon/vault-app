// ================================================
// Supabase Database Type Definitions — GASCLUB247
// ================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          email: string | null;
          role: "member" | "approved_buyer" | "admin" | "super_admin";
          avatar_url: string | null;
          purchase_count: number;
          promo_used: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          email?: string | null;
          role?: "member" | "approved_buyer" | "admin" | "super_admin";
          avatar_url?: string | null;
          purchase_count?: number;
          promo_used?: boolean;
          created_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string;
          email?: string | null;
          role?: "member" | "approved_buyer" | "admin" | "super_admin";
          avatar_url?: string | null;
          purchase_count?: number;
          promo_used?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category: string;
          image_url: string;
          images: Json;
          price: number;
          stock: number;
          status: "in-stock" | "low-stock" | "sold-out";
          description: string;
          tags: Json;
          featured: boolean;
          bulk_tiers: Json | null;
          viewers: number | null;
          recent_orders: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          user_email: string | null;
          user_name: string | null;
          items: Json;
          subtotal: number;
          discount: number;
          shipping_cost: number;
          total: number;
          promo_code: string | null;
          shipping_method: string;
          payment_method: string;
          status: "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled";
          tracking_number: string | null;
          notes: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "order_number" | "created_at" | "updated_at">;
        Update: Partial<Pick<Database["public"]["Tables"]["orders"]["Row"], "status" | "tracking_number" | "notes">>;
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_pct: number;
          one_time: boolean;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["promo_codes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["promo_codes"]["Insert"]>;
      };
      promo_usage: {
        Row: {
          id: string;
          user_id: string;
          promo_code: string;
          used_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["promo_usage"]["Row"], "id" | "used_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Convenience types ─────────────────────────────────────────────────────────
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbProduct = Database["public"]["Tables"]["products"]["Row"];
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
export type DbPromoCode = Database["public"]["Tables"]["promo_codes"]["Row"];
