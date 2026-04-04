#!/bin/bash
# GASCLUB247 — One-click deploy to Vercel production
# Usage: ./deploy.sh "your commit message"

set -e

MSG="${1:-chore: deploy update}"

echo "📦 Staging changes..."
git add -A

echo "💾 Committing: $MSG"
git commit -m "$MSG" 2>/dev/null || echo "Nothing to commit, proceeding with deploy..."

echo "🚀 Deploying to Vercel production..."
npm_config_cache=/tmp/npm-cache-onnleon \
VERCEL_ORG_ID=${VERCEL_ORG_ID} \
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID} \
npx vercel@latest deploy --prod \
--token="${VERCEL_TOKEN}"

echo "✅ Deployed! Live at: https://vault-app-six.vercel.app"
