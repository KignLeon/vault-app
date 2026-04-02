import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only — ADMIN_PASSKEY is never sent to the browser
const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY;
const ADMIN_EMAIL = "admin@gasclub247.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ADMIN_PASSKEY || "GASCLUB247";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { passkey } = await req.json();

    if (!ADMIN_PASSKEY) {
      return NextResponse.json(
        { success: false, error: "Admin access not configured" },
        { status: 500 }
      );
    }

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(passkey?.trim() || "", ADMIN_PASSKEY)) {
      return NextResponse.json(
        { success: false, error: "Invalid passkey" },
        { status: 401 }
      );
    }

    // Passkey is correct — sign in or create the admin account via service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to sign in first
    const { data: signInData, error: signInError } =
      await adminClient.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

    if (!signInError && signInData.session) {
      // Ensure profile has super_admin role
      await adminClient.from("profiles").upsert({
        id: signInData.user.id,
        username: "admin",
        display_name: "Leon Benefield",
        email: "leon@lovoson.com",
        role: "super_admin",
      });

      return NextResponse.json({
        success: true,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
      });
    }

    // Admin account doesn't exist — create it
    const { data: signUpData, error: signUpError } =
      await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          username: "admin",
          display_name: "Leon Benefield",
          avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=admin",
        },
      });

    if (signUpError) {
      return NextResponse.json(
        { success: false, error: "Admin setup failed" },
        { status: 500 }
      );
    }

    // Set profile
    if (signUpData.user) {
      await adminClient.from("profiles").upsert({
        id: signUpData.user.id,
        username: "admin",
        display_name: "Leon Benefield",
        email: "leon@lovoson.com",
        role: "super_admin",
      });
    }

    // Now sign in to get a session
    const { data: newSession, error: newSignInError } =
      await adminClient.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

    if (newSignInError || !newSession.session) {
      return NextResponse.json(
        { success: false, error: "Admin created but sign-in failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: newSession.session.access_token,
        refresh_token: newSession.session.refresh_token,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

// Constant-time string comparison (prevents timing attacks)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a dummy comparison to avoid leaking length info
    let result = 1;
    for (let i = 0; i < b.length; i++) {
      result |= b.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
