#!/usr/bin/env node
// ================================================
// GASCLUB247 — Migration Runner
// Runs all SQL migrations against Supabase via REST API
// ================================================

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE env vars');
  process.exit(1);
}

// Extract project ref from URL
const ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

const migrations = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_seed_products.sql',
  '004_posts_comments_promos.sql',
  '005_new_tables_rls.sql',
];

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runMigrationsDirect() {
  console.log('🚀 GASCLUB247 — Running DB Migrations');
  console.log(`📡 Project: ${ref}`);
  console.log('');

  for (const file of migrations) {
    const filePath = path.join(__dirname, '../supabase/migrations', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} (not found)`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📦 Running ${file}...`);

    // Try using Supabase's pg endpoint directly
    const result = await runSQL(sql);
    
    if (result.status === 200 || result.status === 204) {
      console.log(`✅ ${file} — OK`);
    } else {
      console.log(`⚠️  ${file} — Status ${result.status}: ${result.body.slice(0, 200)}`);
    }
  }

  console.log('');
  console.log('✅ Done! Check your Supabase dashboard to verify tables were created.');
}

runMigrationsDirect().catch(console.error);
