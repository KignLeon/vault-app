/**
 * VAULT Order Notification Engine
 * Sends Email (Resend) + SMS (Twilio) when orders ship or are delivered.
 *
 * Required env vars (add to Vercel + .env.local):
 *   RESEND_API_KEY        — get from resend.com
 *   RESEND_FROM_EMAIL     — your verified sender, e.g. orders@gasclub247.app
 *   TWILIO_ACCOUNT_SID   — from twilio.com/console
 *   TWILIO_AUTH_TOKEN    — from twilio.com/console
 *   TWILIO_FROM_NUMBER   — your Twilio phone number, e.g. +18005551234
 *
 * If these vars are not configured, notification calls are silently skipped.
 */

export async function sendOrderNotification(
  order: Record<string, unknown>,
  event: "shipped" | "delivered"
): Promise<void> {
  const promises: Promise<void>[] = [];

  // ── Email via Resend ──────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY && order.user_email) {
    promises.push(sendResendEmail(order, event));
  } else {
    console.log(`[notifications] Resend skipped — ${!process.env.RESEND_API_KEY ? "no RESEND_API_KEY" : "no user_email"}`);
  }

  // ── SMS via Twilio ─────────────────────────────────────────────────────────
  // Extract phone from customer_phone field or from the notes field (format: "Phone: +1234...")
  const phoneRaw = (order.customer_phone as string) ||
    String(order.notes || "").match(/Phone:\s*([\+\d\s\-()]{7,})/)?.[1] || "";
  const phone = phoneRaw.replace(/\s/g, "").trim();

  if (process.env.TWILIO_ACCOUNT_SID && phone && phone.length >= 10) {
    promises.push(sendTwilioSms(order, event, phone));
  } else {
    console.log(`[notifications] Twilio skipped — ${!process.env.TWILIO_ACCOUNT_SID ? "no TWILIO_ACCOUNT_SID" : "no valid phone"}`);
  }

  const results = await Promise.allSettled(promises);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[notifications] Channel ${i} failed:`, r.reason);
    }
  });
}

async function sendResendEmail(
  order: Record<string, unknown>,
  event: "shipped" | "delivered"
): Promise<void> {
  const subject =
    event === "shipped"
      ? `📦 Your order ${order.order_number} has shipped!`
      : `✅ Your order ${order.order_number} has been delivered!`;

  const trackingSection = order.tracking_number
    ? `<p style="margin:8px 0"><strong>Tracking #:</strong> ${order.tracking_number}${
        order.carrier ? ` (${order.carrier})` : ""
      }</p>${
        order.tracking_url
          ? `<p style="margin:8px 0"><a href="${order.tracking_url}" style="color:#fff">📍 Track your package →</a></p>`
          : ""
      }`
    : "";

  const deliverySection =
    order.estimated_delivery
      ? `<p style="margin:8px 0"><strong>Est. Delivery:</strong> ${new Date(
          order.estimated_delivery as string
        ).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>`
      : "";

  const htmlBody = `
    <div style="font-family:monospace;max-width:600px;margin:0 auto;padding:32px;background:#000;color:#fff;">
      <div style="letter-spacing:0.3em;font-size:12px;color:#888;margin-bottom:24px;">GASCLUB247</div>
      <h1 style="font-size:16px;letter-spacing:0.15em;margin:0 0 8px">${subject}</h1>
      <p style="color:#888;font-size:12px;margin:0 0 24px">Order #${order.order_number}</p>

      <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;">
        ${trackingSection}
        ${deliverySection}
        ${!trackingSection && !deliverySection ? "<p style='color:#888;font-size:12px'>Your order is on its way!</p>" : ""}
      </div>

      <p style="margin:0 0 8px;font-size:12px;color:#888">
        ${event === "shipped"
          ? "You will receive another update when your package is delivered."
          : "Thank you for ordering with GASCLUB247. We appreciate your business."}
      </p>

      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #222;font-size:10px;color:#444;letter-spacing:0.15em;">
        GASCLUB247 · PRIVATE PLATFORM · ALL RIGHTS RESERVED
      </div>
    </div>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "orders@gasclub247.app",
      to: [order.user_email as string],
      subject,
      html: htmlBody,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Resend API error ${resp.status}: ${body}`);
  }

  console.log(`[notifications] Resend email sent for order ${order.order_number} (${event})`);
}

async function sendTwilioSms(
  order: Record<string, unknown>,
  event: "shipped" | "delivered",
  toPhone: string
): Promise<void> {
  const message =
    event === "shipped"
      ? `📦 GASCLUB247: Your order ${order.order_number} has shipped!${
          order.tracking_number ? ` Tracking: ${order.tracking_number}` : ""
        }${
          order.tracking_url ? `\nTrack: ${order.tracking_url}` : ""
        }`
      : `✅ GASCLUB247: Your order ${order.order_number} has been delivered! Thank you for your business.`;

  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_FROM_NUMBER!,
        To: toPhone,
        Body: message,
      }),
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Twilio API error ${resp.status}: ${body}`);
  }

  console.log(`[notifications] Twilio SMS sent for order ${order.order_number} to ${toPhone} (${event})`);
}
