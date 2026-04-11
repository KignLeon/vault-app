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

// ── Fetch ALL products via server-side API (bypasses RLS) ─────────────────────
// Uses /api/products which runs with the service role key.
// This is the ONLY source of truth for all product data.
export async function fetchProducts(): Promise<NormalizedProduct[]> {
  try {
    // Determine the base URL for the API call
    const baseUrl = typeof window !== "undefined"
      ? "" // Client-side: relative URL
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

    const fetchPromise = fetch(`${baseUrl}/api/products`, {
      cache: "no-store",
      next: { revalidate: 0 },
    }).then(async (res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      return json.products || [];
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Product fetch timed out (10s)")), 10000)
    );

    const rawProducts = await Promise.race([fetchPromise, timeoutPromise]);
    return rawProducts.map(normalizeProduct);
  } catch (e) {
    console.error("[fetchProducts] Error:", e);
    return [];
  }
}
