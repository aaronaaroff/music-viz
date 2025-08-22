#!/bin/bash

echo "🚀 Building production bundle..."
pnpm build

echo "📦 Testing production build locally..."
echo "This will simulate the Vercel production environment"
echo ""
echo "Test checklist:"
echo "1. Navigate to http://localhost:4173/explore"
echo "2. Refresh the page (Cmd+R) - should not 404"
echo "3. Open new tab and go directly to http://localhost:4173/saved"
echo "4. Test switching between tabs"
echo "5. Check if sessions persist"
echo ""

# Serve the production build
pnpm preview --host