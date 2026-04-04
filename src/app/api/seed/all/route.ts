import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { products as localProducts } from "@/lib/data";

// Helper: verify admin Bearer token
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  return !!profile && ["admin", "super_admin"].includes(profile.role);
}

// POST /api/seed/all — Seed everything: products + posts + comments (admin only)
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;


  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Record<string, any> = {};

  // ── 1. Seed Products ──────────────────────────────────────────────────
  const productRows = localProducts.map(p => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    image_url: p.image || "",
    images: p.images || [],
    price: p.price,
    stock: p.stock,
    status: "in-stock", // all products are in-stock per user request
    description: p.description,
    tags: p.tags || [],
    featured: p.featured || false,
    bulk_tiers: p.bulk || null,
    viewers: p.viewers || Math.floor(Math.random() * 30) + 5,
    recent_orders: p.recentOrders || Math.floor(Math.random() * 10) + 1,
  }));

  const { error: prodErr } = await admin
    .from("products")
    .upsert(productRows, { onConflict: "sku" });

  results.products = prodErr
    ? { success: false, error: prodErr.message }
    : { success: true, count: productRows.length };

  // ── 2. Seed Posts ─────────────────────────────────────────────────────
  const seedPosts = [
    {
      type: "announcement",
      title: "🔥 GASCLUB247 IS LIVE",
      content: "The vault is officially open. Premium strains, direct pricing, no middlemen. Welcome to the club.",
      author_name: "Leon Benefield",
      pinned: true, featured: true, likes: 47,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      type: "drop",
      title: "🚀 PLATINUM LEMON CHERRY — NOW AVAILABLE",
      content: "One of the most requested strains just dropped. Indoor grown, heavy trichomes, citrus-gas profile. Limited quantities — grab before it's gone.",
      author_name: "Leon Benefield",
      pinned: false, featured: true, likes: 32,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      type: "update",
      title: "BULK PRICING IS HERE 📦",
      content: "QP and HP pricing now available on all flower. The more you grab, the more you save. Check the inventory for tiered pricing on every strain.",
      author_name: "GASCLUB247",
      pinned: false, featured: false, likes: 28,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      type: "review",
      title: "⭐ LEMON DIOR RUNTZ — Customer Review",
      content: "Just got my pack of Lemon Dior Runtz. The smell alone is crazy — sweet lemon with a diesel finish. Bag appeal is 10/10. Burns clean, smooth smoke, heavy head high. Best I've had in months. Will be back for the QP.",
      author_name: "SmokeKing_LA",
      pinned: false, featured: false, likes: 19,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      type: "promo",
      title: "🎁 FIRST-TIME BUYER PROMO — 25% OFF",
      content: "New to the club? Use code PROMO1 at checkout for 25% off your first order. One-time use, no minimum. Welcome to GASCLUB247.",
      author_name: "GASCLUB247",
      pinned: true, featured: false, likes: 35,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      type: "media",
      title: "📸 FRESH PACK — RAINBOW KANDY",
      content: "Just opened up a fresh unit of Rainbow Kandy. The colors on these nugs are insane — purple, green, orange hairs everywhere. This one is going to move fast.",
      author_name: "Leon Benefield",
      pinned: false, featured: false, likes: 22,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      type: "update",
      title: "NEW CATEGORY: PRE-ROLLS 🔥",
      content: "By popular demand — pre-rolls are now available. 5 strains, all indoor flower, hand-rolled. Perfect for sampling before committing to a pack. Check the inventory.",
      author_name: "GASCLUB247",
      pinned: false, featured: false, likes: 15,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      type: "drop",
      title: "💎 EXOTIC DROP — LCG 85 & GASTOPIA",
      content: "Two new exotics just hit the vault. LCG 85 is a heavy indica with a pungent gas nose. Gastopia is a balanced hybrid with fruit-forward terps. Both are premium grade.",
      author_name: "Leon Benefield",
      pinned: false, featured: true, likes: 41,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  // Check if posts already exist
  const { count: existingPosts } = await admin
    .from("posts")
    .select("*", { count: "exact", head: true });

  if ((existingPosts || 0) < 5) {
    const { data: insertedPosts, error: postErr } = await admin
      .from("posts")
      .upsert(seedPosts, { onConflict: "title" })
      .select("id, title");

    if (postErr) {
      // Table may not exist — try to just insert
      const { data: insertedPosts2, error: postErr2 } = await admin
        .from("posts")
        .insert(seedPosts)
        .select("id, title");

      results.posts = postErr2
        ? { success: false, error: postErr2.message }
        : { success: true, count: insertedPosts2?.length || 0 };

      // Seed comments on inserted posts
      if (insertedPosts2 && insertedPosts2.length > 0) {
        await seedComments(admin, insertedPosts2);
        results.comments = { success: true };
      }
    } else {
      results.posts = { success: true, count: insertedPosts?.length || 0 };
      if (insertedPosts && insertedPosts.length > 0) {
        await seedComments(admin, insertedPosts);
        results.comments = { success: true };
      }
    }
  } else {
    results.posts = { success: true, message: "Posts already seeded", count: existingPosts };
  }

  return NextResponse.json({ success: true, results });
}

async function seedComments(
  admin: any,
  posts: Array<{ id: string; title: string }>
) {
  const findPost = (substr: string) => posts.find(p => p.title.includes(substr));

  const commentSets: Array<{ postSubstr: string; comments: Array<{ author_name: string; content: string; likes: number; hoursAgo: number }> }> = [
    {
      postSubstr: "IS LIVE",
      comments: [
        { author_name: "DankMaster420", content: "Finally a real plug with consistent quality. Been looking for something like this 🔥", likes: 8, hoursAgo: 144 },
        { author_name: "WestCoastSmoke", content: "The UI on this platform is crazy clean. Feels like ordering from a luxury brand.", likes: 5, hoursAgo: 138 },
        { author_name: "Terp_Hunter", content: "Prices are fair too. No cap, this is how it should be done.", likes: 3, hoursAgo: 126 },
      ],
    },
    {
      postSubstr: "PLATINUM LEMON",
      comments: [
        { author_name: "BagChaser_OG", content: "Copped the QP immediately. This strain is gas 💨", likes: 6, hoursAgo: 108 },
        { author_name: "NugLife", content: "The pics don't do it justice. Terps are insane in person.", likes: 4, hoursAgo: 96 },
      ],
    },
    {
      postSubstr: "FIRST-TIME",
      comments: [
        { author_name: "FirstTimer_J", content: "Used the code on my first order, saved a ton. Good looks 🙌", likes: 7, hoursAgo: 54 },
        { author_name: "CaliSmoke", content: "This deal is crazy. 25% off is wild for this quality.", likes: 4, hoursAgo: 48 },
      ],
    },
    {
      postSubstr: "Customer Review",
      comments: [
        { author_name: "PurpleDream", content: "Facts on the Lemon Dior. That strain hits different 🍋⛽", likes: 5, hoursAgo: 60 },
        { author_name: "ZenSmoker", content: "Second this review 100%. The cure on mine was perfect.", likes: 3, hoursAgo: 51 },
      ],
    },
  ];

  for (const set of commentSets) {
    const post = findPost(set.postSubstr);
    if (!post) continue;

    const rows = set.comments.map(c => ({
      post_id: post.id,
      author_name: c.author_name,
      content: c.content,
      likes: c.likes,
      created_at: new Date(Date.now() - c.hoursAgo * 3600000).toISOString(),
    }));

    await (admin as any).from("comments").insert(rows);
  }
}
