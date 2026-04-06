#!/bin/bash
# GASCLUB247 — One-click deploy to Vercel production
# Usage: ./deploy.sh "your commit message"
#
# Required environment variables (set in .env.local or export before running):
#   VERCEL_TOKEN         — Your Vercel personal access token
#   VERCEL_ORG_ID        — Your Vercel organization/team ID
#   VERCEL_PROJECT_ID    — Your Vercel project ID

set -e

# Load env vars from .env.local if present
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | grep -E '^VERCEL_' | xargs) 2>/dev/null || true
fi

# Validate required vars
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not set. Add it to .env.local or export it."
  exit 1
fi

MSG="${1:-chore: deploy update}"

echo "📦 Staging changes..."
git add -A

echo "💾 Committing: $MSG"
git commit -m "$MSG" 2>/dev/null || echo "Nothing to commit, proceeding with deploy..."

echo "🚀 Deploying to Vercel production..."
npm_config_cache=/tmp/npm-cache-onnleon \
VERCEL_ORG_ID="${VERCEL_ORG_ID}" \
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID}" \
npx vercel@latest deploy --prod \
--token="${VERCEL_TOKEN}"

echo "✅ Deployed! Live at: https://vault-app-six.vercel.app"
