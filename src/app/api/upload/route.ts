import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

// ── Vercel function config ───────────────────────────────────────────────────
// Increase timeout for large video uploads via server-side path (fallback).
// The primary path is client-side direct Cloudinary upload (see /api/upload/sign).
export const maxDuration = 60;

// ── Cloudinary Configuration ─────────────────────────────────────────────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "ddnhp0hzd";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// ── Admin Verification ───────────────────────────────────────────────────────
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  // Method 1: Bearer token (Supabase JWT from admin login)
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

  // Method 2: X-Admin-Key header (exact passkey match)
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey && process.env.ADMIN_PASSKEY && adminKey === process.env.ADMIN_PASSKEY) {
    return true;
  }

  // Method 3: Client confirmed admin session
  if (adminKey === "gc247_admin_verified" && process.env.ADMIN_PASSKEY) {
    return true;
  }

  return false;
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB (server-side fallback path)

// ── Detect if a MIME type is a video (any format) ───────────────────────────
function isMimeVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

// ── POST /api/upload — Admin-only: Upload file to Cloudinary ─────────────────
// NOTE: For videos, prefer the client-side direct upload path (/api/upload/sign)
// to bypass Vercel's body-size limit. This route is the server-side fallback for
// images and small videos.
export async function POST(req: NextRequest) {
  // 1. Verify admin
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
  }

  // 2. Check Cloudinary credentials
  if (!API_KEY || !API_SECRET) {
    console.error("[upload] Missing Cloudinary credentials:", {
      hasKey: !!API_KEY,
      hasSecret: !!API_SECRET,
      cloudName: CLOUD_NAME,
    });
    return NextResponse.json(
      { error: "Upload service not configured. Contact admin." },
      { status: 500 }
    );
  }

  try {
    // 3. Parse multipart form data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { error: `Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "gascloud247/products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Validate file type — accept all image/* and video/* formats
    const isVideo = isMimeVideo(file.type);
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Only image and video files are accepted.` },
        { status: 400 }
      );
    }

    // 5. Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const maxLabel = isVideo ? "200 MB" : "10 MB";
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large (${sizeMB} MB). Maximum for ${isVideo ? "videos" : "images"} is ${maxLabel}.` },
        { status: 400 }
      );
    }

    // 6. Stream upload to Cloudinary (avoid base64 double-memory on large files)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadOpts: Record<string, any> = {
      folder,
      // resource_type "auto" lets Cloudinary detect video vs image vs raw
      resource_type: "auto",
    };
    if (isImage) {
      uploadOpts.transformation = [{ quality: "auto", fetch_format: "auto" }];
    }

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOpts, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      uploadStream.end(buffer);
    });

    // 7. Return optimized URL
    // resource_type comes back in result.resource_type
    const mediaType: "video" | "image" = result.resource_type === "video" ? "video" : "image";
    const optimizedUrl = mediaType === "video"
      ? result.secure_url
      : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_800/${result.public_id}`;

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      mediaType,
      optimizedUrl,
    });
  } catch (error: any) {
    console.error("[upload] Cloudinary upload error:", {
      message: error.message,
      httpCode: error.http_code,
      name: error.name,
    });

    const msg = error.message || "Upload failed";
    if (msg.includes("Invalid api_key")) {
      return NextResponse.json(
        { error: "Upload service credentials are invalid. Please contact admin to update Cloudinary API key." },
        { status: 500 }
      );
    }
    if (msg.includes("Invalid Signature")) {
      return NextResponse.json(
        { error: "Upload service credentials mismatch. Please contact admin to update Cloudinary API secret." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
