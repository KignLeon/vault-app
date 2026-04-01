import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

// Configuration
const ASSETS_DIR = path.join(process.cwd(), '_assets', 'vault');
const BATCH_SIZE = 5;

// Required Keys
if (!process.env.CLOUDINARY_URL) {
  console.error("❌ CLOUDINARY_URL is missing in .env.local");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Supabase URL or SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadToCloudinary(filePath, folder) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `vault/${folder}`,
      use_filename: true,
      unique_filename: false,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Cloudinary upload failed for ${filePath}:`, error.message);
    return null;
  }
}

async function run() {
  console.log("🚀 Starting Global Asset Ingestion & DB Seeding...");
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ Assets directory not found at ${ASSETS_DIR}`);
    return;
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const products = [];

  for (const file of files) {
    if (file.startsWith('.') || file.endsWith('.ai') || fs.statSync(path.join(ASSETS_DIR, file)).isDirectory()) {
      continue;
    }

    const filePath = path.join(ASSETS_DIR, file);
    console.log(`\n⏳ Processing: ${file}`);
    
    // In a real scenario, we'd parse category from organized folders. 
    // Here we derive from the file name or default.
    const category = "featured"; // default category
    const nameMatch = file.replace(/\.(png|jpe?g)$/i, '').replace(/_/g, ' ').toUpperCase();
    
    const imageUrl = await uploadToCloudinary(filePath, category);
    
    if (imageUrl) {
      products.push({
        name: nameMatch,
        sku: `TC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        category: category,
        price: Math.floor(Math.random() * (150 - 100) + 100),
        stock: 50,
        status: 'in-stock',
        image: imageUrl,
        images: [imageUrl],
        description: "Premium product directly from the vault.",
      });
      console.log(`✅ Uploaded to Cloudinary: ${imageUrl}`);
    }
  }

  // Insert to Supabase
  if (products.length > 0) {
    console.log(`\n⏳ Inserting ${products.length} products to Supabase...`);
    const { data, error } = await supabase.from('products').insert(products).select();
    
    if (error) {
      console.error("❌ Supabase Insertion Error:", error);
    } else {
      console.log(`✅ Successfully seeded database with ${data.length} products.`);
    }
  } else {
    console.log("\n⚠️ No products to process.");
  }
}

run();
