import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route runs server-side with the service role key,
// bypassing RLS completely. It's the definitive way to
// serve products to the public storefront.

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
      return NextResponse.json({ products: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (err: any) {
    console.error("[api/products] Exception:", err.message);
    return NextResponse.json({ products: [], error: err.message }, { status: 500 });
  }
}
