import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── POST /api/orders/find — Look up a single order by order_number ────────────
// Used by the "Find Your Order" feature so users can retrieve orders from ANY device.
// No auth required — the order number itself serves as proof of access.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber || typeof orderNumber !== "string" || orderNumber.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid order number." }, { status: 400 });
    }

    const trimmed = orderNumber.trim().toUpperCase();
    const admin = getAdminClient();

    const { data, error } = await admin
      .from("orders")
      .select("id, order_number, items, subtotal, discount, shipping_cost, total, promo_code, shipping_method, payment_method, status, tracking_number, created_at")
      .eq("order_number", trimmed)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found. Please check the number and try again." }, { status: 404 });
    }

    // Also save it to the user's local tracked orders
    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error("[POST /api/orders/find] unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
