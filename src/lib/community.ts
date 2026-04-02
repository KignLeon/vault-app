// ================================================
// GASCLUB247 — Community Posts & Comments DB Layer
// ================================================

import { supabase } from "@/lib/supabase";
import { posts as localPosts } from "@/lib/data";

export interface DbPost {
  id: string;
  type: "announcement" | "drop" | "update" | "media" | "review" | "promo";
  title: string;
  content: string;
  author_id: string | null;
  author_name: string | null;
  image_url: string | null;
  pinned: boolean;
  featured: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface DbComment {
  id: string;
  post_id: string;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  content: string;
  likes: number;
  created_at: string;
}

// Convert local posts to DbPost shape
function localToDbPost(p: typeof localPosts[number]): DbPost {
  return {
    id: p.id,
    type: p.type as DbPost["type"],
    title: p.title,
    content: p.content,
    author_id: null,
    author_name: p.author,
    image_url: p.image || null,
    pinned: p.pinned,
    featured: false,
    likes: 0,
    created_at: p.timestamp,
    updated_at: p.timestamp,
  };
}

// ── Get local posts instantly (no network) ────────────────────────────────────
export function getLocalPosts(): DbPost[] {
  return localPosts.map(localToDbPost);
}

// ── Fetch all posts ────────────────────────────────────────────────────────────
export async function fetchPosts(): Promise<DbPost[]> {
  try {
    const fetchPromise = (supabase as any)
      .from("posts")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "Posts query timed out (3s)" } }), 3000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn("[fetchPosts] Supabase error, using local posts:", error.message);
      return localPosts.map(localToDbPost);
    }
    if (!data || data.length === 0) {
      console.warn("[fetchPosts] No posts in DB, using local posts");
      return localPosts.map(localToDbPost);
    }
    
    // UI/UX Requirement: EVERY post must include images
    // If a DB post lacks an image_url, we assign a high-fidelity fallback.
    const FALLBACK_IMAGES = [
      "https://res.cloudinary.com/ddnhp0hzd/image/upload/f_auto,q_auto,w_800/v1775013257/gasclub247/products/platinum-lemon-cherry.jpg",
      "https://res.cloudinary.com/ddnhp0hzd/image/upload/f_auto,q_auto,w_800/v1775013257/gasclub247/products/pink-panther.jpg",
      "https://res.cloudinary.com/ddnhp0hzd/image/upload/f_auto,q_auto,w_800/v1/gasclub247/products/indoors/rainbow-belts.jpg",
      "https://res.cloudinary.com/ddnhp0hzd/image/upload/f_auto,q_auto,w_800/v1/gasclub247/products/exotic/gastopia.jpg"
    ];
    
    return data.map((d: DbPost, index: number) => ({
      ...d,
      image_url: d.image_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    }));
  } catch (e) {
    console.warn("[fetchPosts] Fetch failed, using local posts");
    return localPosts.map(localToDbPost);
  }
}

// ── Create a post ──────────────────────────────────────────────────────────────
export async function createPost(data: {
  type: DbPost["type"];
  title: string;
  content: string;
  authorId?: string;
  authorName?: string;
  imageUrl?: string;
  pinned?: boolean;
  featured?: boolean;
}): Promise<{ success: boolean; post?: DbPost; error?: string }> {
  const { data: post, error } = await (supabase as any)
    .from("posts")
    .insert({
      type: data.type,
      title: data.title,
      content: data.content,
      author_id: data.authorId || null,
      author_name: data.authorName || "GASCLUB247",
      image_url: data.imageUrl || null,
      pinned: data.pinned || false,
      featured: data.featured || false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, post };
}

// ── Update a post ─────────────────────────────────────────────────────────────
export async function updatePost(
  postId: string,
  updates: Partial<Pick<DbPost, "title" | "content" | "type" | "pinned" | "featured" | "image_url">>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("posts")
    .update(updates)
    .eq("id", postId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Delete a post ─────────────────────────────────────────────────────────────
export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Fetch comments for a post ─────────────────────────────────────────────────
export async function fetchComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await (supabase as any)
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data || [];
}

// ── Add a comment ─────────────────────────────────────────────────────────────
export async function addComment(data: {
  postId: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
}): Promise<{ success: boolean; comment?: DbComment; error?: string }> {
  const { data: comment, error } = await (supabase as any)
    .from("comments")
    .insert({
      post_id: data.postId,
      author_id: data.authorId || null,
      author_name: data.authorName || "Anonymous",
      author_avatar: data.authorAvatar || null,
      content: data.content,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, comment };
}

// ── Delete a comment ──────────────────────────────────────────────────────────
export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Promo code management ─────────────────────────────────────────────────────
export async function fetchPromoCodes() {
  const { data, error } = await (supabase as any)
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function createPromoCode(data: {
  code: string;
  discountPct: number;
  oneTime: boolean;
  maxUses?: number;
  expiresAt?: string;
  minOrderAmount?: number;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("promo_codes")
    .insert({
      code: data.code.toUpperCase().trim(),
      discount_pct: data.discountPct,
      one_time: data.oneTime,
      active: true,
      max_uses: data.maxUses || null,
      expires_at: data.expiresAt || null,
      min_order_amount: data.minOrderAmount || null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePromoCode(
  id: string,
  updates: { active?: boolean; discount_pct?: number }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("promo_codes")
    .update(updates)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePromoCode(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── User management (admin) ───────────────────────────────────────────────────
export async function fetchAllUsers() {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function updateUserRole(
  userId: string,
  role: "member" | "approved_buyer" | "admin" | "super_admin"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Add a new product (admin) ─────────────────────────────────────────────────
export async function createProduct(data: {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageUrl?: string;
  tags?: string[];
  featured?: boolean;
  bulkTiers?: Array<{ label: string; qty: string; price: number }>;
}): Promise<{ success: boolean; error?: string }> {
  const status = data.stock === 0 ? "sold-out" : data.stock <= 10 ? "low-stock" : "in-stock";

  const { error } = await (supabase as any)
    .from("products")
    .insert({
      sku: data.sku.toUpperCase().trim(),
      name: data.name.trim(),
      category: data.category,
      price: data.price,
      stock: data.stock,
      status,
      image_url: data.imageUrl || "",
      description: data.description,
      tags: JSON.stringify(data.tags || []),
      featured: data.featured || false,
      bulk_tiers: data.bulkTiers ? JSON.stringify(data.bulkTiers) : null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Delete a product (admin) ──────────────────────────────────────────────────
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("products")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
