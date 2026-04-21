import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderNotification } from "./_notifications";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── POST /api/orders — Create a new order ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { items, subtotal, discount, shippingCost, total, promoCode, shippingMethod, paymentMethod, name, email, phone, address, city, state, zip, notes, userId, orderId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get session from Authorization header
    const authHeader = request.headers.get("authorization");
    let sessionUserId = userId || null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) sessionUserId = user.id;
    }

    const admin = getAdminClient();

    // Insert the order
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        user_id: sessionUserId,
        user_name: name || null,
        user_email: email || null,
        items: items,
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        shipping_cost: Number(shippingCost) || 0,
        total: Number(total) || 0,
        promo_code: promoCode || null,
        shipping_method: shippingMethod || "standard",
        payment_method: paymentMethod || "crypto",
        status: "pending",
        notes: phone ? `Phone: ${phone}${notes ? ' | ' + notes : ''}` : (notes || null),
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/orders] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire Telegram notification asynchronously (non-blocking)
    sendTelegramNotification(order).catch((err) =>
      console.error("[Telegram webhook] failed:", err)
    );

    return NextResponse.json({
      success: true,
      orderId: order.order_number,
      orderDbId: order.id,
    });
  } catch (err) {
    console.error("[POST /api/orders] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/orders — Fetch orders (admin only) ────────────────────────────────
export async function GET(request: NextRequest) {
  // Require valid admin Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const admin = getAdminClient();

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") || "50");

  let query = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders: data || [] });
}


// ── PATCH /api/orders — Update order status (admin only) ──────────────────────
export async function PATCH(request: NextRequest) {
  // Require valid admin Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const admin = getAdminClient();

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    orderId,
    status,
    trackingNumber,
    carrier,
    trackingUrl,
    estimatedDelivery,
    customerPhone,
  } = body;

  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Fetch current order state before patching (needed for notification idempotency)
  const { data: currentOrder } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  // Build the updates object — only include fields that were explicitly provided
  const updates: Record<string, unknown> = {};
  if (status !== undefined)             updates.status            = status;
  if (trackingNumber !== undefined)     updates.tracking_number   = trackingNumber;
  if (carrier !== undefined)            updates.carrier           = carrier;
  if (trackingUrl !== undefined)        updates.tracking_url      = trackingUrl;
  if (estimatedDelivery !== undefined)  updates.estimated_delivery = estimatedDelivery || null;
  if (customerPhone !== undefined)      updates.customer_phone    = customerPhone;

  const { error } = await admin.from("orders").update(updates).eq("id", orderId);
  if (error) {
    console.error("[PATCH /api/orders] update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Audit event + Notifications (status changes only, non-blocking) ──────
  if (status && currentOrder?.status !== status) {
    // Log audit event
    void Promise.resolve(admin.from("order_events").insert({
      order_id: orderId,
      event_type: "status_change",
      old_value: currentOrder?.status,
      new_value: status,
      metadata: {
        changed_by: user.id,
        tracking_number: trackingNumber || currentOrder?.tracking_number,
      },
    })).catch((e: Error) => console.warn("[order_events insert]", e.message));

    // Build merged order object for notification
    const updatedOrder = { ...currentOrder, ...updates };

    // 🔔 Fire shipped notification (idempotent — only if not already notified)
    if (status === "shipped" && !currentOrder?.notified_shipped) {
      sendOrderNotification(updatedOrder, "shipped").catch(console.error);
      void Promise.resolve(admin.from("orders").update({ notified_shipped: true }).eq("id", orderId)).catch(() => {});
    }

    // 🔔 Fire delivered notification (idempotent)
    if ((status === "completed" || status === "delivered") && !currentOrder?.notified_delivered) {
      sendOrderNotification(updatedOrder, "delivered").catch(console.error);
      void Promise.resolve(admin.from("orders").update({ notified_delivered: true }).eq("id", orderId)).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}

// ── Telegram Notification ─────────────────────────────────────────────────────
async function sendTelegramNotification(order: {
  order_number: string;
  user_name: string | null;
  user_email: string | null;
  items: unknown;
  total: number;
  payment_method: string;
  shipping_method: string;
  notes: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] Bot token or chat ID not configured — skipping notification");
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const itemLines = items
    .map((i: { name?: string; qty?: number; price?: number }) => `  • ${i.name || "?"} × ${i.qty || 1} — $${((i.price || 0) * (i.qty || 1)).toFixed(2)}`)
    .join("\n");

  const message = [
    `🔔 *NEW ORDER — ${order.order_number}*`,
    ``,
    `👤 *Customer:* ${order.user_name || "Guest"}`,
    `📧 *Email:* ${order.user_email || "N/A"}`,
    ``,
    `📦 *Items:*`,
    itemLines,
    ``,
    `💰 *Total: $${Number(order.total).toFixed(2)}*`,
    `💳 *Payment:* ${String(order.payment_method).toUpperCase()}`,
    `🚚 *Shipping:* ${String(order.shipping_method).toUpperCase()}`,
    order.notes ? `📝 *Notes:* ${order.notes}` : null,
    ``,
    `⏰ ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT`,
  ]
    .filter(Boolean)
    .join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}
