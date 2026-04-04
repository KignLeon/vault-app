import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  return !!profile && ["admin", "super_admin"].includes(profile.role);
}

// POST /api/seed/migrate — Run SQL migrations (admin only)
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Array<{ file: string; success: boolean; error?: string }> = [];

  // Read and execute each migration file
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  
  let files: string[] = [];
  try {
    files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
  } catch {
    return NextResponse.json({ error: "Could not read migrations directory" }, { status: 500 });
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const { error } = await admin.rpc("exec_sql", { query: sql }).single();
    
    if (error) {
      // Try individual statements if batch fails
      results.push({ file, success: false, error: error.message });
    } else {
      results.push({ file, success: true });
    }
  }

  return NextResponse.json({ results });
}
