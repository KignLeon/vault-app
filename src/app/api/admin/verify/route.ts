import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only — ADMIN_PASSKEY is never sent to the browser
const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY;
const ADMIN_EMAIL = "admin@gasclub247.app";
// ADMIN_PASSWORD must be set explicitly — no fallback to prevent hardcoded-secret vulnerability
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ── Brute-force protection: max 5 login attempts per IP per 5 minutes ─────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isAdminBruteForced(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60_000 });
    return false;
  }
  record.count++;
  return record.count > 5; // Hard limit: 5 attempts per 5 minutes
}

export async function POST(req: NextRequest) {
  // Rate-limit check before doing anything
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  if (isAdminBruteForced(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { passkey } = await req.json();


    if (!ADMIN_PASSKEY) {
      return NextResponse.json(
        { success: false, error: "Admin access not configured" },
        { status: 500 }
      );
    }

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Admin system not properly configured" },
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

    // Passkey is correct — sign in the admin account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Step 1: Try to sign in with current ADMIN_PASSWORD ─────────────────
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

    // ── Step 2: Sign-in failed — admin user exists but password is stale ───
    // Use service role to look up the user and force-update their password
    const { data: listData, error: listError } =
      await adminClient.auth.admin.listUsers();

    const existingAdmin = listData?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existingAdmin) {
      // Force-update the admin user's password to match ADMIN_PASSWORD
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingAdmin.id,
        { password: ADMIN_PASSWORD }
      );

      if (updateError) {
        return NextResponse.json(
          { success: false, error: "Admin password update failed" },
          { status: 500 }
        );
      }

      // Now sign in with the new password
      const { data: refreshedSession, error: refreshedError } =
        await adminClient.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

      if (refreshedError || !refreshedSession.session) {
        return NextResponse.json(
          { success: false, error: "Sign-in failed after password update" },
          { status: 500 }
        );
      }

      // Ensure super_admin role
      await adminClient.from("profiles").upsert({
        id: refreshedSession.user.id,
        username: "admin",
        display_name: "Leon Benefield",
        email: "leon@lovoson.com",
        role: "super_admin",
      });

      return NextResponse.json({
        success: true,
        session: {
          access_token: refreshedSession.session.access_token,
          refresh_token: refreshedSession.session.refresh_token,
        },
      });
    }

    // ── Step 3: Admin account doesn't exist at all — create it ─────────────
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
        { success: false, error: "Admin setup failed: " + signUpError.message },
        { status: 500 }
      );
    }

    if (signUpData.user) {
      await adminClient.from("profiles").upsert({
        id: signUpData.user.id,
        username: "admin",
        display_name: "Leon Benefield",
        email: "leon@lovoson.com",
        role: "super_admin",
      });
    }

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
