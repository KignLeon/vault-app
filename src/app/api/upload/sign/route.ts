import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "ddnhp0hzd";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// ── Admin Verification (same as upload route) ────────────────────────────────
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile && ["admin", "super_admin"].includes(profile.role)) return true;
        if (user.email === "admin@gasclub247.app") return true;
      }
    } catch {}
  }
  // X-Admin-Key: must match exact ADMIN_PASSKEY env var — no hardcoded bypass values
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey && process.env.ADMIN_PASSKEY && adminKey === process.env.ADMIN_PASSKEY) return true;
  return false;
}

// ── POST /api/upload/sign ─────────────────────────────────────────────────────
// Returns a signed upload signature so the browser can POST directly to
// Cloudinary's /upload endpoint — completely bypassing Vercel's body-size limit.
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!API_KEY || !API_SECRET) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const folder: string = body.folder || "gasclub247/products";
    const resourceType: string = body.resource_type || "auto";

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, API_SECRET!);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: CLOUD_NAME,
      apiKey: API_KEY,
      folder,
      resourceType,
    });
  } catch (err: any) {
    console.error("[upload/sign]", err.message);
    return NextResponse.json({ error: err.message || "Failed to sign upload" }, { status: 500 });
  }
}
