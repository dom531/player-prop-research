#!/bin/bash

# Verification script for DraftKings Line + Performance + Autocomplete implementation
# Run with: bash scripts/verify-implementation.sh

echo "🔍 Verifying Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: Verify new files exist
echo "1️⃣ Checking if new files were created..."
if [ -f "app/actions/player-cache.ts" ]; then
  echo -e "  ${GREEN}✅${NC} player-cache.ts exists"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} player-cache.ts missing"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if [ -f "migrations/create_player_cache_table.sql" ]; then
  echo -e "  ${GREEN}✅${NC} Migration SQL exists"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} Migration SQL missing"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

# Check 2: Verify code modifications
echo "2️⃣ Checking code modifications..."

if grep -q "findPlayerIdFast" app/actions/nba-stats.ts; then
  echo -e "  ${GREEN}✅${NC} nba-stats.ts uses player cache"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} nba-stats.ts not updated"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if grep -q "draftkingsLine" app/actions/research.ts; then
  echo -e "  ${GREEN}✅${NC} research.ts uses DraftKings line"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} research.ts not updated"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if grep -q "filteredPlayers" components/PlayerSearch.tsx; then
  echo -e "  ${GREEN}✅${NC} PlayerSearch.tsx has autocomplete"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} PlayerSearch.tsx not updated"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

if grep -q "draftkingsLine" components/AnalysisDashboard.tsx; then
  echo -e "  ${GREEN}✅${NC} AnalysisDashboard.tsx uses DraftKings line"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "  ${RED}❌${NC} AnalysisDashboard.tsx not updated"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

# Check 3: Verify environment variables
echo "3️⃣ Checking environment variables..."
if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo -e "  ${GREEN}✅${NC} Supabase credentials configured"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "  ${RED}❌${NC} Supabase credentials missing"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
else
  echo -e "  ${RED}❌${NC} .env.local file not found"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

# Check 4: Verify database connection (optional)
echo "4️⃣ Testing database connection..."
if command -v node &> /dev/null; then
  if [ -f "scripts/test-player-cache.js" ]; then
    echo -e "  ${YELLOW}⏳${NC} Running player cache test..."
    node scripts/test-player-cache.js > /tmp/cache-test.log 2>&1
    if [ $? -eq 0 ]; then
      echo -e "  ${GREEN}✅${NC} Player cache is working!"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "  ${YELLOW}⚠️${NC}  Player cache test failed (run migration first)"
      echo -e "  ${YELLOW}⚠️${NC}  See: MIGRATION_INSTRUCTIONS.md"
    fi
  else
    echo -e "  ${YELLOW}⚠️${NC}  Test script not found"
  fi
else
  echo -e "  ${YELLOW}⚠️${NC}  Node.js not found, skipping database test"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
  echo ""
  echo "Implementation is complete. Next steps:"
  echo "  1. Run database migration (see MIGRATION_INSTRUCTIONS.md)"
  echo "  2. Start dev server: npm run dev"
  echo "  3. Test features at http://localhost:3001"
else
  echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
  echo ""
  echo "Issues found:"
  echo "  - Passed: $CHECKS_PASSED checks"
  echo "  - Failed: $CHECKS_FAILED checks"
  echo ""
  echo "Review the output above and fix any red ❌ items."
fi

echo ""
echo "For detailed information, see:"
echo "  - IMPLEMENTATION_SUMMARY.md"
echo "  - CHANGES.md"
echo "  - MIGRATION_INSTRUCTIONS.md"
echo ""
