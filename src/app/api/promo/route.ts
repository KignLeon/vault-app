import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public GET endpoint — returns active promo codes (non-sensitive fields only).
// Used by the /deals page to display real promotions to customers.
// No auth required — promo codes are meant to be shared with customers.

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const admin = getAdminClient();

    const { data, error } = await admin
      .from("promo_codes")
      .select("id, code, discount_pct, expires_at, min_order_amount, one_time, active, max_uses, use_count")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/promo] Supabase error:", error.message);
      const resp = NextResponse.json({ promos: [], error: error.message }, { status: 500 });
      resp.headers.set("Cache-Control", "no-store");
      return resp;
    }

    // Filter out expired codes
    const now = new Date();
    const active = (data || []).filter((p: any) => {
      if (!p.expires_at) return true;
      return new Date(p.expires_at) > now;
    });

    const resp = NextResponse.json({ promos: active });
    resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return resp;
  } catch (err: any) {
    console.error("[api/promo] Exception:", err.message);
    const resp = NextResponse.json({ promos: [], error: err.message }, { status: 500 });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  }
}
