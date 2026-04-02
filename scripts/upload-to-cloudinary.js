#!/usr/bin/env node
// ================================================
// GASCLUB247 — Cloudinary Asset Upload Script
// 
// Usage: node scripts/upload-to-cloudinary.js
// Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local
// ================================================

const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Logo Upload ──────────────────────────────────────────────────────────────
async function uploadLogo() {
  console.log("📤 Uploading GASCLUB247 logo...");
  try {
    const result = await cloudinary.uploader.upload("public/gasclub247-logo.png", {
      folder: "gasclub247/brand",
      public_id: "gasclub247-logo",
      overwrite: true,
      resource_type: "image",
    });
    console.log("✅ Logo uploaded:", result.secure_url);
    return result.secure_url;
  } catch (err) {
    console.error("❌ Logo upload failed:", err.message);
    return null;
  }
}

// ── Product Image Manifest ────────────────────────────────────────────────────
// Maps Google Drive product names to Cloudinary folder structure
// Based on the Drive inventory scan:
const PRODUCT_MANIFEST = [
  // Pre-rolls
  { name: "WARHEADZ", file: null, category: "pre-rolls", flavor: "warheadz-preroll" },
  { name: "SUPREME LATTO", file: null, category: "pre-rolls", flavor: "supreme-latto-preroll" },
  { name: "PINK PANTHER", file: null, category: "pre-rolls", flavor: "pink-panther-preroll" },
  { name: "LEMON DIOR RUNTZ", file: null, category: "pre-rolls", flavor: "lemondiorruntz-preroll" },
  { name: "BERRY POP", file: null, category: "pre-rolls", flavor: "berry-pop-preroll" },
  
  // Indoor (Jan 30 batch)
  { name: "RAINBOW BELTS", file: null, category: "indoors", flavor: "rainbow-belts" },
  { name: "LEMON BERRY GELATO", file: null, category: "indoors", flavor: "lemon-berry-gelato" },
  { name: "BLUE JAM", file: null, category: "indoors", flavor: "blue-jam" },

  // Greenhouse (Jan 30 batch)
  { name: "ZALATO", file: null, category: "greenhouse", flavor: "zalato" },
  { name: "WHITE GUMMIES", file: null, category: "greenhouse", flavor: "white-gummies" },
  { name: "GUMBO", file: null, category: "greenhouse", flavor: "gumbo" },
  { name: "GALACTIC GUMMIES", file: null, category: "greenhouse", flavor: "galactic-gummies" },
  { name: "CANDY RUNTZ", file: null, category: "greenhouse", flavor: "candy-runtz" },
  { name: "67 RUNTZ", file: null, category: "greenhouse", flavor: "67-runtz" },
];

async function generatePublicUrls() {
  console.log("\n📋 Generating Cloudinary URL manifest...\n");
  
  const manifest = {};
  
  for (const product of PRODUCT_MANIFEST) {
    const publicId = `gasclub247/products/${product.category}/${product.flavor}`;
    const url = cloudinary.url(publicId, { secure: true, format: "jpg" });
    manifest[product.name] = {
      publicId,
      url,
      category: product.category,
    };
    console.log(`  ${product.name}: ${url}`);
  }

  // Write manifest
  fs.writeFileSync(
    "scripts/cloudinary-manifest.json",
    JSON.stringify(manifest, null, 2)
  );
  
  console.log("\n✅ Manifest written to scripts/cloudinary-manifest.json");
  return manifest;
}

// ── Upload local product images if they exist ─────────────────────────────────
async function uploadLocalImages() {
  const productsDir = "public/products";
  if (!fs.existsSync(productsDir)) {
    console.log("⚠️  No local /public/products directory found — skipping local image upload");
    return;
  }

  const files = fs.readdirSync(productsDir);
  console.log(`\n📤 Uploading ${files.length} local product images...\n`);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) continue;

    const name = path.basename(file, ext);
    const filePath = path.join(productsDir, file);

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "gasclub247/products",
        public_id: name.toLowerCase().replace(/\s+/g, "-"),
        overwrite: true,
        resource_type: "image",
      });
      console.log(`  ✅ ${name}: ${result.secure_url}`);
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 GASCLUB247 Cloudinary Upload Script\n");
  
  if (!process.env.CLOUDINARY_API_KEY) {
    console.error("❌ CLOUDINARY_API_KEY not set in .env.local");
    console.log("   Copy .env.local.template to .env.local and fill in your Cloudinary credentials");
    process.exit(1);
  }

  await uploadLogo();
  await uploadLocalImages();
  await generatePublicUrls();
  
  console.log("\n✅ Done! Add your CLOUDINARY_CLOUD_NAME to .env.local and run:\n");
  console.log("   node scripts/upload-to-cloudinary.js\n");
}

main().catch(console.error);
