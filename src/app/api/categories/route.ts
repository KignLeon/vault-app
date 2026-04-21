import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── GET /api/categories ──────────────────────────────────────────────────────
// Returns all categories derived from:
//   1. Explicit categories table (if it exists)
//   2. DISTINCT category values from products table (always works)
// Merged + deduplicated + sorted alphabetically.
export async function GET() {
  try {
    const admin = getAdminClient();
    let merged: string[] = [];

    // 1. Try explicit categories table
    try {
      const { data: catRows, error } = await admin
        .from("categories")
        .select("slug")
        .order("name", { ascending: true });
      if (!error && catRows) {
        merged.push(...catRows.map((r: any) => r.slug).filter(Boolean));
      }
    } catch {
      // Table doesn't exist yet — that's OK
    }

    // 2. Always also pull DISTINCT category from products
    const { data: prodRows } = await admin
      .from("products")
      .select("category")
      .not("category", "is", null)
      .not("category", "eq", "");

    if (prodRows) {
      const prodCats = prodRows.map((r: any) => r.category).filter(Boolean);
      merged.push(...prodCats);
    }

    // Deduplicate + sort
    const categories = [...new Set(merged)].sort();

    // Hardcoded fallback (only used if DB is completely empty)
    if (categories.length === 0) {
      const fallback = ["featured", "exotic", "candy", "gas", "premium", "prerolls", "smalls"];
      const resp = NextResponse.json({ categories: fallback });
      resp.headers.set("Cache-Control", "no-store");
      return resp;
    }

    const resp = NextResponse.json({ categories });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  } catch (err: any) {
    console.error("[api/categories GET]", err.message);
    // Return known-good fallback on any error
    return NextResponse.json({
      categories: ["featured", "exotic", "candy", "gas", "premium", "prerolls", "smalls"],
    });
  }
}

// ── POST /api/categories ─────────────────────────────────────────────────────
// Creates a new named category.
// If the categories table doesn't exist, the slug is still returned so the
// admin UI can use it immediately — it will persist once a product is assigned.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawName: string = (body.name || "").trim();
    if (!rawName) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Normalize to slug: lowercase, spaces → hyphens
    const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) {
      return NextResponse.json({ error: "Invalid category name" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Try to persist to categories table (may not exist — graceful degradation)
    try {
      await admin.from("categories").upsert(
        { name: rawName, slug },
        { onConflict: "slug" }
      );
    } catch {
      // Table doesn't exist — category will appear once a product uses it
    }

    const resp = NextResponse.json({ success: true, slug, name: rawName });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  } catch (err: any) {
    console.error("[api/categories POST]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/categories ───────────────────────────────────────────────────
// Removes a category from the explicit categories table.
// Does NOT remove it from products (those remain with their category string).
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { slug } = body;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const admin = getAdminClient();
    try {
      await admin.from("categories").delete().eq("slug", slug);
    } catch {
      // Table doesn't exist — nothing to delete
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
