import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ddnhp0hzd",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: verify admin Bearer token
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return !!profile && ["admin", "super_admin"].includes(profile.role);
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/upload — Admin-only: Upload image to Cloudinary
export async function POST(req: NextRequest) {
  // ── Require admin session ──────────────────────────────────────────────────
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "gasclub247/products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── File type whitelist ────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // ── File size limit ────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // Convert file to base64 data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      optimizedUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || "ddnhp0hzd"}/image/upload/f_auto,q_auto,w_800/${result.public_id}`,
    });
  } catch (error: any) {
    console.error("[upload] Cloudinary error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
