import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, items, total, user_id } = body;

    if (!order_id || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Send Telegram Notification
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const itemLines = items.map((i: any) => `- ${i.qty}x ${i.product.name} ($${i.product.price})`).join('\n');
      
      const message = `
🛍️ *NEW ORDER RECEIVED* 🛍️

*Order ID:* \`${order_id}\`
*User ID:* \`${user_id || 'Guest'}\`

*Items:*
${itemLines}

*Total:* $${total.toFixed(2)}

_Awaiting payment coordination._
      `.trim();

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } else {
      console.warn("⚠️ Telegram webhook not configured (Missing tokens). Order notification skipped.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
