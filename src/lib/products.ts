import { supabase } from "@/lib/supabase";
import type { DbProduct } from "@/lib/supabase-types";

// Re-export DB product type as the universal Product shape
export type { DbProduct as Product };

// ── Safely parse a JSON value that might be a string, array, or null ──────────
function safeJsonArray<T = any>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

function safeJsonObject<T = any>(val: unknown): T | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "object" && !Array.isArray(val)) return val as T;
  if (Array.isArray(val)) return val as unknown as T;
  if (typeof val === "string") {
    try { return JSON.parse(val) as T; } catch { return undefined; }
  }
  return undefined;
}

// ── Convert DB product → UI-compatible shape ──────────────────────────────────
export function normalizeProduct(p: DbProduct) {
  const images = safeJsonArray<string>(p.images);
  const tags = safeJsonArray<string>(p.tags);
  const bulk = safeJsonObject<Array<{ label: string; qty: string; price: number }>>(p.bulk_tiers);

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    stock: p.stock,
    status: p.status as "in-stock" | "low-stock" | "sold-out",
    image: p.image_url || "",
    images,
    description: p.description,
    tags,
    featured: p.featured,
    bulk: Array.isArray(bulk) ? bulk : undefined,
    viewers: p.viewers || 0,
    recentOrders: p.recent_orders || 0,
  };
}

export type NormalizedProduct = ReturnType<typeof normalizeProduct>;

// ── Fetch ALL products from Supabase (the ONLY source of truth) ──────────────
// No local fallback. If Supabase is down, returns empty array + logs the error.
export async function fetchProducts(): Promise<NormalizedProduct[]> {
  try {
    const fetchPromise = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "Supabase query timed out (8s)" } }), 8000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error("[fetchProducts] Supabase error:", error.message);
      return [];
    }

    if (!data) {
      console.warn("[fetchProducts] No data returned from Supabase");
      return [];
    }

    return data.map(normalizeProduct);
  } catch (e) {
    console.error("[fetchProducts] Exception:", e);
    return [];
  }
}

// ── Fetch products by category ─────────────────────────────────────────────────
export async function fetchProductsByCategory(category: string): Promise<NormalizedProduct[]> {
  if (category === "all") return fetchProducts();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchProductsByCategory] error:", error.message);
    return [];
  }

  return (data || []).map(normalizeProduct);
}

// ── Fetch single product by ID ─────────────────────────────────────────────────
export async function fetchProductById(id: string): Promise<NormalizedProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return normalizeProduct(data);
}
