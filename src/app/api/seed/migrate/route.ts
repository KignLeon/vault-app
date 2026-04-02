import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// POST /api/seed/migrate — Run SQL migrations against Supabase
export async function POST(req: NextRequest) {
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
