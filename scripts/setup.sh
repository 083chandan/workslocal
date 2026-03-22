#!/usr/bin/env bash
set -euo pipefail

echo "🚀 WorksLocal - Development Setup"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not installed. Install Node.js 20+ from https://nodejs.org"; exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required (found $(node -v))"; exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm via corepack..."
  corepack enable && corepack prepare pnpm@9.15.0 --activate
fi
echo "✅ pnpm v$(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Build all packages
echo ""
echo "🔨 Building packages..."
pnpm turbo build

# Set up local D1 database
echo ""
echo "🗄️  Setting up local D1 database..."
cd relay/cloudflare
pnpm run db:migrate:local
wrangler d1 execute workslocal-db --local --file=seed.sql
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the relay:  cd relay/cloudflare && pnpm run dev"
echo "  2. Start the CLI:    WORKSLOCAL_SERVER_URL=ws://localhost:8787/ws node apps/cli/dist/index.js http 8080 --name myapp"
echo "  3. Test:             curl -H 'Host: myapp.workslocal.exposed' http://localhost:8787/"