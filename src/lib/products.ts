import { supabase } from "@/lib/supabase";
import type { DbProduct } from "@/lib/supabase-types";
import { products as localProducts } from "@/lib/data";

// Re-export DB product type as the universal Product shape
export type { DbProduct as Product };

// ── Convert DB product → legacy-compatible shape ──────────────────────────────
// The existing UI uses product.image, product.images (array), product.bulk, etc.
// We normalize from Supabase column names to what the UI expects.
export function normalizeProduct(p: DbProduct) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    stock: p.stock,
    status: p.status as "in-stock" | "low-stock" | "sold-out",
    image: p.image_url || "",
    images: (p.images as string[]) || [],
    description: p.description,
    tags: (p.tags as string[]) || [],
    featured: p.featured,
    bulk: p.bulk_tiers as Array<{ label: string; qty: string; price: number }> | undefined,
    viewers: p.viewers || 0,
    recentOrders: p.recent_orders || 0,
  };
}

export type NormalizedProduct = ReturnType<typeof normalizeProduct>;

// ── Convert local product data → NormalizedProduct shape ──────────────────────
function fromLocalProduct(p: typeof localProducts[number]): NormalizedProduct {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    status: p.status,
    image: p.image,
    images: p.images,
    description: p.description,
    tags: p.tags,
    featured: p.featured || false,
    bulk: p.bulk,
    viewers: p.viewers || 0,
    recentOrders: p.recentOrders || 0,
  };
}

// ── Get local products instantly (no network) ────────────────────────────────
export function getLocalProducts(): NormalizedProduct[] {
  return localProducts.map(fromLocalProduct);
}

// ── Fetch all products (with local fallback) ──────────────────────────────────
export async function fetchProducts(): Promise<NormalizedProduct[]> {
  try {
    // Race against a timeout to prevent indefinite hangs
    const fetchPromise = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "Supabase query timed out (3s)" } }), 3000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn("[fetchProducts] Supabase error, using local catalog:", error.message);
      return localProducts.map(fromLocalProduct);
    }

    if (!data || data.length === 0) {
      console.warn("[fetchProducts] No products in DB, using local catalog");
      return localProducts.map(fromLocalProduct);
    }

    return data.map(normalizeProduct);
  } catch (e) {
    console.warn("[fetchProducts] Fetch failed, using local catalog");
    return localProducts.map(fromLocalProduct);
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

// ── Update product (admin only) ────────────────────────────────────────────────
export async function updateProduct(
  id: string,
  updates: {
    price?: number;
    stock?: number;
    status?: string;
    image_url?: string;
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    featured?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  // Convert tags array to JSON if present
  const dbUpdates: Record<string, any> = { ...updates };
  if (dbUpdates.tags) dbUpdates.tags = JSON.stringify(dbUpdates.tags);

  const { error } = await (supabase as any)
    .from("products")
    .update(dbUpdates)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
