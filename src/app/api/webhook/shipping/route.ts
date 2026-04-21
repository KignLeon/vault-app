/**
 * POST /api/webhook/shipping
 *
 * Receives carrier tracking webhooks from Shippo or EasyPost.
 * Auto-updates order status and sends customer notifications.
 *
 * Setup:
 *   1. Add SHIPPING_WEBHOOK_SECRET to Vercel env vars (any random string)
 *   2. Register https://your-domain.com/api/webhook/shipping in Shippo/EasyPost dashboard
 *   3. Set the webhook secret header to match SHIPPING_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderNotification } from "../../orders/_notifications";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Map carrier status codes → our internal status
const SHIPPO_STATUS_MAP: Record<string, string> = {
  DELIVERED:        "completed",
  IN_TRANSIT:       "shipped",
  OUT_FOR_DELIVERY: "shipped",
  RETURNED:         "cancelled",
  FAILURE:          "cancelled",
};

const EASYPOST_STATUS_MAP: Record<string, string> = {
  delivered:        "completed",
  in_transit:       "shipped",
  out_for_delivery: "shipped",
  return_to_sender: "cancelled",
  failure:          "cancelled",
};

export async function POST(req: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────
  const secret = req.headers.get("x-webhook-secret") || req.headers.get("x-shippo-webhook-secret");
  if (process.env.SHIPPING_WEBHOOK_SECRET && secret !== process.env.SHIPPING_WEBHOOK_SECRET) {
    console.warn("[webhook/shipping] Unauthorized webhook call — bad secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Parse Shippo format ──────────────────────────────────────────────────
  let trackingNumber: string | undefined;
  let rawStatus: string = "";
  let orderNumber: string = "";
  let trackingUrl: string | undefined;

  // Shippo: event = "tracker.updated"
  if (payload?.event?.startsWith("tracker")) {
    trackingNumber = payload?.data?.tracking_number;
    rawStatus = payload?.data?.tracking_status?.status || "";
    orderNumber = payload?.data?.metadata || "";
    trackingUrl = payload?.data?.tracking_url_provider;
  }
  // EasyPost: object_type = "Tracker"
  else if (payload?.object_type === "Tracker" || payload?.result?.tracking_code) {
    const data = payload?.result || payload;
    trackingNumber = data?.tracking_code;
    rawStatus = data?.status || "";
    orderNumber = data?.reference || payload?.description || "";
    trackingUrl = data?.public_url;
  }

  if (!orderNumber || !trackingNumber) {
    console.log("[webhook/shipping] Missing orderNumber or trackingNumber — skipping");
    return NextResponse.json({ received: true });
  }

  // ── Map status ────────────────────────────────────────────────────────────
  const newStatus = SHIPPO_STATUS_MAP[rawStatus.toUpperCase()] || EASYPOST_STATUS_MAP[rawStatus.toLowerCase()];
  if (!newStatus) {
    console.log(`[webhook/shipping] Unknown status "${rawStatus}" — skipping`);
    return NextResponse.json({ received: true });
  }

  const admin = getAdminClient();

  // ── Fetch order ───────────────────────────────────────────────────────────
  const { data: order, error: fetchErr } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (fetchErr || !order) {
    console.warn(`[webhook/shipping] Order "${orderNumber}" not found`);
    return NextResponse.json({ received: true });
  }

  if (order.status === newStatus) {
    console.log(`[webhook/shipping] Order already in state "${newStatus}" — no-op`);
    return NextResponse.json({ received: true });
  }

  // ── Update order ──────────────────────────────────────────────────────────
  await admin
    .from("orders")
    .update({
      status: newStatus,
      tracking_number: trackingNumber,
      ...(trackingUrl ? { tracking_url: trackingUrl } : {}),
    })
    .eq("id", order.id);

  // ── Log event ─────────────────────────────────────────────────────────────
  await admin.from("order_events").insert({
    order_id: order.id,
    event_type: "status_change",
    old_value: order.status,
    new_value: newStatus,
    metadata: { source: "carrier_webhook", tracking_number: trackingNumber, raw_status: rawStatus },
  }).catch(() => {});

  // ── Notifications ─────────────────────────────────────────────────────────
  const updatedOrder = { ...order, status: newStatus, tracking_number: trackingNumber, tracking_url: trackingUrl };

  if (newStatus === "shipped" && !order.notified_shipped) {
    sendOrderNotification(updatedOrder, "shipped").catch(console.error);
    await admin.from("orders").update({ notified_shipped: true }).eq("id", order.id);
  }

  if (newStatus === "completed" && !order.notified_delivered) {
    sendOrderNotification(updatedOrder, "delivered").catch(console.error);
    await admin.from("orders").update({ notified_delivered: true }).eq("id", order.id);
  }

  console.log(`[webhook/shipping] Order ${orderNumber} → ${newStatus}`);
  return NextResponse.json({ received: true, order: orderNumber, status: newStatus });
}
