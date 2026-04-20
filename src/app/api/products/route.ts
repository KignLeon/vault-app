import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route runs server-side with the service role key,
// bypassing RLS completely. It's the definitive way to
// serve products to the public storefront.
// Cache-Control: no-store ensures Vercel never serves stale products after admin edits.

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
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/products] Supabase error:", error.message);
      const resp = NextResponse.json({ products: [], error: error.message }, { status: 500 });
      resp.headers.set("Cache-Control", "no-store");
      return resp;
    }

    const resp = NextResponse.json({ products: data || [] });
    resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return resp;
  } catch (err: any) {
    console.error("[api/products] Exception:", err.message);
    const resp = NextResponse.json({ products: [], error: err.message }, { status: 500 });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  }
}
