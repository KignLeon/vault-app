import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { products as localProducts } from "@/lib/data";

// POST /api/seed — Seed all products from data.ts into Supabase
// Requires SUPABASE_SERVICE_ROLE_KEY (server-side only)
export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Missing Supabase service role key" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Map local products to DB schema
  const rows = localProducts.map(p => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    image_url: p.image || "",
    images: p.images || [],
    price: p.price,
    stock: p.stock,
    status: "in-stock" as const, // All products start as in-stock per user request
    description: p.description,
    tags: p.tags || [],
    featured: p.featured || false,
    bulk_tiers: p.bulk || null,
    viewers: p.viewers || Math.floor(Math.random() * 30) + 5,
    recent_orders: p.recentOrders || Math.floor(Math.random() * 10) + 1,
  }));

  // Upsert all — uses SKU as unique constraint
  const { data, error } = await admin
    .from("products")
    .upsert(rows, { onConflict: "sku" });

  if (error) {
    console.error("[seed] Error:", error);
    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    seeded: rows.length,
    message: `Seeded ${rows.length} products into Supabase`,
  });
}

// GET /api/seed — Check seed status
export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ configured: false });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { count, error } = await admin
    .from("products")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    configured: true,
    productsInDb: count || 0,
    productsInLocal: localProducts.length,
    needsSeed: (count || 0) < localProducts.length,
  });
}
