import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── POST /api/orders/mine — Fetch specific orders by order_number list ────────
// Used by the user-facing orders page to retrieve their own orders.
// No auth required — order numbers serve as proof of ownership.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumbers } = body;

    if (!orderNumbers || !Array.isArray(orderNumbers) || orderNumbers.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Limit to 50 orders max for safety
    const limitedNumbers = orderNumbers.slice(0, 50);

    const admin = getAdminClient();

    const { data, error } = await admin
      .from("orders")
      .select("id, order_number, items, subtotal, discount, shipping_cost, total, promo_code, shipping_method, payment_method, status, tracking_number, created_at")
      .in("order_number", limitedNumbers)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[POST /api/orders/mine] query error:", error);
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    console.error("[POST /api/orders/mine] unexpected error:", err);
    return NextResponse.json({ orders: [] });
  }
}
