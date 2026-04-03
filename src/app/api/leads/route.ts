import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/leads — collect email + phone for lead capture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Insert into leads table (upsert on email to avoid duplicates)
    const { error } = await admin.from("leads").upsert(
      {
        email: email?.toLowerCase().trim() || null,
        phone: phone?.trim() || null,
        source: "welcome_modal",
        promo_offered: "WELCOME247",
        created_at: new Date().toISOString(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (error) {
      // Table may not exist yet — log but don't block the user
      console.warn("[POST /api/leads] DB error (non-blocking):", error.message);
    }

    // Always return success + promo code (even if DB write failed, we still reward action)
    return NextResponse.json({
      success: true,
      promoCode: "WELCOME247",
      discount: 20,
      message: "20% off your first order",
    });
  } catch (err) {
    console.error("[POST /api/leads] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/leads — admin: fetch all leads (requires admin Bearer token)
export async function GET(request: NextRequest) {
  // Require valid admin Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const admin = getAdminClient();

  // Validate the token is a real Supabase session
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user has admin/super_admin role
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data || [] });
}
