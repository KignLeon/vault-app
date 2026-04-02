#!/bin/bash
# ================================================
# GASCLUB247 — Go-Live Deployment Script
# Run after configuring .env.local
# ================================================

set -e

echo "🚀 GASCLUB247 — Go-Live Script"
echo ""

# 1. Check env file
if [ ! -f ".env.local" ]; then
  echo "❌ .env.local not found. Run: cp .env.local.template .env.local"
  exit 1
fi

# 2. Load envs
source .env.local 2>/dev/null || true

echo "✅ Environment loaded"

# 3. Verify build passes
echo ""
echo "📦 Building..."
npm run build

echo ""
echo "✅ Build passed"

# 4. Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."

# Set env vars from .env.local
if command -v vercel &> /dev/null; then
  vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL" 2>/dev/null || true
  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY" 2>/dev/null || true
  vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || true
  vercel env add CLOUDINARY_CLOUD_NAME production <<< "$CLOUDINARY_CLOUD_NAME" 2>/dev/null || true
  vercel env add CLOUDINARY_API_KEY production <<< "$CLOUDINARY_API_KEY" 2>/dev/null || true
  vercel env add CLOUDINARY_API_SECRET production <<< "$CLOUDINARY_API_SECRET" 2>/dev/null || true
  vercel env add TELEGRAM_BOT_TOKEN production <<< "$TELEGRAM_BOT_TOKEN" 2>/dev/null || true
  vercel env add TELEGRAM_CHAT_ID production <<< "$TELEGRAM_CHAT_ID" 2>/dev/null || true
  vercel env add ADMIN_PASSKEY production <<< "$ADMIN_PASSKEY" 2>/dev/null || true

  vercel --prod
else
  echo "⚠️  Vercel CLI not found. Please deploy via:"
  echo "   1. Push to GitHub"
  echo "   2. Import project at vercel.com/import"
  echo "   3. Add env vars from .env.local in Vercel dashboard"
  echo "   4. Deploy"
fi

echo ""
echo "✅ Done!"
