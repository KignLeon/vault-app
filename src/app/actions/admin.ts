"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// ── Supabase Admin Client (service role — bypasses RLS) ─────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars for admin client");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Admin Verification ──────────────────────────────────────────────────────
export async function verifyAdminContext(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const admin = getAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return false;

    // Check profile role
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile && ["admin", "super_admin"].includes(profile.role)) return true;

    // Fallback: check email
    if (user.email === "admin@gasclub247.app") return true;
  } catch (err) {
    console.error("[verifyAdminContext] error:", err);
  }
  return false;
}

// ── Helper: Prepare updates for DB (ensure jsonb columns are proper objects, not double-stringified) ──
function prepareDbUpdates(updates: Record<string, any>): Record<string, any> {
  const clean = { ...updates };

  // tags: ensure it's a proper array for jsonb (not a JSON string)
  if ("tags" in clean) {
    if (typeof clean.tags === "string") {
      try { clean.tags = JSON.parse(clean.tags); } catch { clean.tags = []; }
    }
    if (!Array.isArray(clean.tags)) clean.tags = [];
  }

  // images: ensure it's a proper array for jsonb
  if ("images" in clean) {
    if (typeof clean.images === "string") {
      try { clean.images = JSON.parse(clean.images); } catch { clean.images = []; }
    }
    if (!Array.isArray(clean.images)) clean.images = [];
  }

  // bulk_tiers: ensure proper jsonb
  if ("bulk_tiers" in clean && typeof clean.bulk_tiers === "string") {
    try { clean.bulk_tiers = JSON.parse(clean.bulk_tiers); } catch { clean.bulk_tiers = null; }
  }

  return clean;
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/home");
  revalidatePath("/inventory");
  revalidatePath("/deals");
  revalidatePath("/admin");
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function createProductAction(
  token: string | null,
  data: {
    sku: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    imageUrl?: string;
    images?: string[];
    tags?: string[];
    featured?: boolean;
    bulkTiers?: Array<{ label: string; qty: string; price: number }>;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const status = data.stock === 0 ? "sold-out" : data.stock <= 10 ? "low-stock" : "in-stock";
  const admin = getAdminClient();

  const { error } = await admin.from("products").insert({
    sku: data.sku.toUpperCase().trim(),
    name: data.name.trim(),
    category: data.category,
    price: data.price,
    stock: data.stock,
    status,
    image_url: data.imageUrl || "",
    images: data.images || [],          // Pass as array — Supabase handles jsonb natively
    description: data.description || "",
    tags: data.tags || [],              // Pass as array
    featured: data.featured || false,
    bulk_tiers: data.bulkTiers || null, // Pass as object/null
  });

  if (error) {
    console.error("[createProductAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function updateProductAction(
  token: string | null,
  id: string,
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const admin = getAdminClient();
  const dbUpdates = prepareDbUpdates(updates);

  const { error } = await admin.from("products").update(dbUpdates).eq("id", id);
  if (error) {
    console.error("[updateProductAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteProductAction(
  token: string | null,
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) {
    console.error("[deleteProductAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function bulkUpdateProductsAction(
  token: string | null,
  ids: string[],
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };
  if (!ids || ids.length === 0) return { success: true };

  const admin = getAdminClient();
  const dbUpdates = prepareDbUpdates(updates);

  const { error } = await admin.from("products").update(dbUpdates).in("id", ids);
  if (error) {
    console.error("[bulkUpdateProductsAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function bulkDeleteProductsAction(
  token: string | null,
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };
  if (!ids || ids.length === 0) return { success: true };

  const admin = getAdminClient();
  const { error } = await admin.from("products").delete().in("id", ids);
  if (error) {
    console.error("[bulkDeleteProductsAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════════════════
// POST / COMMUNITY ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function createPostAction(
  token: string | null,
  data: {
    type: string;
    title: string;
    content: string;
    authorId?: string;
    authorName?: string;
    imageUrl?: string;
    pinned?: boolean;
    featured?: boolean;
  }
): Promise<{ success: boolean; post?: any; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: post, error } = await admin.from("posts").insert({
    type: data.type,
    title: data.title,
    content: data.content,
    author_id: data.authorId || null,
    author_name: data.authorName || "GASCLUB247",
    image_url: data.imageUrl || null,
    pinned: data.pinned || false,
    featured: data.featured || false,
  }).select().single();

  if (error) {
    console.error("[createPostAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true, post };
}

export async function updatePostAction(
  token: string | null,
  postId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.from("posts").update(updates).eq("id", postId);
  if (error) {
    console.error("[updatePostAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function deletePostAction(
  token: string | null,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  const admin = getAdminClient();
  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("[deletePostAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════════════════
// SEED DATABASE ACTION
// ══════════════════════════════════════════════════════════════════════════════

export async function seedDatabaseAction(
  token: string | null
): Promise<{ success: boolean; seeded?: number; error?: string }> {
  if (!(await verifyAdminContext(token))) return { success: false, error: "Unauthorized" };

  // Dynamic import to avoid shipping data.ts to every page bundle
  const { products: localProducts } = await import("@/lib/data");

  const admin = getAdminClient();

  const rows = localProducts.map((p: any) => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    image_url: p.image || "",
    images: p.images || [],
    price: p.price,
    stock: p.stock,
    status: p.status || "in-stock",
    description: p.description || "",
    tags: p.tags || [],
    featured: p.featured || false,
    bulk_tiers: p.bulk || null,
    viewers: p.viewers || Math.floor(Math.random() * 30) + 5,
    recent_orders: p.recentOrders || Math.floor(Math.random() * 10) + 1,
  }));

  const { error } = await admin
    .from("products")
    .upsert(rows, { onConflict: "sku" });

  if (error) {
    console.error("[seedDatabaseAction] error:", error);
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true, seeded: rows.length };
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK DB STATUS ACTION
// ══════════════════════════════════════════════════════════════════════════════

export async function checkDbStatusAction(): Promise<{
  configured: boolean;
  productsInDb: number;
  error?: string;
}> {
  try {
    const admin = getAdminClient();
    const { count, error } = await admin
      .from("products")
      .select("*", { count: "exact", head: true });

    if (error) return { configured: true, productsInDb: 0, error: error.message };
    return { configured: true, productsInDb: count || 0 };
  } catch (e: any) {
    return { configured: false, productsInDb: 0, error: e.message };
  }
}
