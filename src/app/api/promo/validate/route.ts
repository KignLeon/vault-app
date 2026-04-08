import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── In-memory rate limiter (per IP, resets across cold starts — acceptable for MVP) ──
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 }); // 1-min window
    return false;
  }
  record.count++;
  return record.count > 10; // Max 10 promo attempts per minute per IP
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/promo/validate — server-side promo code validation
// Body: { code: string, userId?: string }
// Returns: { valid: boolean, discount: number, oneTime: boolean, error?: string }
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { valid: false, error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const code = (body.code || "").toUpperCase().trim();
    const userId = body.userId || null;

    if (!code) {
      return NextResponse.json({ valid: false, error: "No code provided" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Check promo_codes table in Supabase (server-side, never exposed to client)
    const { data: promo, error } = await admin
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .single();

    // Check WELCOME247 from env (lead capture promo — no DB entry needed)
    const welcomePromo = (process.env.WELCOME_PROMO_CODE || "WELCOME247").toUpperCase();
    const welcomeDiscount = Number(process.env.WELCOME_PROMO_DISCOUNT || "20");

    if (error || !promo) {
      // If the code matches the welcome promo, validate it directly (no DB entry required)
      if (code === welcomePromo) {
        return NextResponse.json({
          valid: true,
          discount: welcomeDiscount / 100,
          oneTime: false,
          code: welcomePromo,
        });
      }
      return NextResponse.json({ valid: false, error: "Invalid promo code" });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "Promo code has expired" });
    }

    // Check max uses
    if (promo.max_uses && promo.usage_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: "Promo code has reached its usage limit" });
    }

    // Check one-time use per user
    if (promo.one_time && userId) {
      const { data: prevUse } = await admin
        .from("promo_uses")
        .select("id")
        .eq("promo_code", code)
        .eq("user_id", userId)
        .single();

      if (prevUse) {
        return NextResponse.json({ valid: false, error: "You've already used this promo code" });
      }
    }

    // Return validated promo from DB
    return NextResponse.json({
      valid: true,
      discount: promo.discount_pct / 100,
      oneTime: promo.one_time,
      code: promo.code,
    });

  } catch (err: any) {
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
