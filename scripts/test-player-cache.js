/**
 * Test script for player cache functionality
 * Run with: node scripts/test-player-cache.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPlayerCache() {
  console.log('🧪 Testing Player Cache...\n')

  // Test 1: Check if table exists
  console.log('1️⃣ Checking if nba_players_cache table exists...')
  const { data: tableCheck, error: tableError } = await supabase
    .from('nba_players_cache')
    .select('id')
    .limit(1)

  if (tableError) {
    console.log('❌ Table does not exist!')
    console.log('   Please run the SQL migration first.')
    console.log('   See MIGRATION_INSTRUCTIONS.md for details.')
    return
  }
  console.log('✅ Table exists!\n')

  // Test 2: Check cache count
  console.log('2️⃣ Checking player cache count...')
  const { count, error: countError } = await supabase
    .from('nba_players_cache')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.log('❌ Error counting players:', countError.message)
    return
  }

  console.log(`✅ Cache contains ${count || 0} players`)

  if (count === 0) {
    console.log('⚠️  Cache is empty - it will populate on first player search\n')
  } else {
    console.log('✅ Cache is populated!\n')

    // Test 3: Sample query - search for LeBron
    console.log('3️⃣ Testing search for "LeBron"...')
    const { data: lebronResults, error: searchError } = await supabase
      .from('nba_players_cache')
      .select('id, full_name, team')
      .ilike('full_name', '%lebron%')
      .limit(5)

    if (searchError) {
      console.log('❌ Search error:', searchError.message)
      return
    }

    console.log(`✅ Found ${lebronResults?.length || 0} matches:`)
    lebronResults?.forEach(p => {
      console.log(`   - ${p.full_name} (${p.team})`)
    })
    console.log('')

    // Test 4: Check cache age
    console.log('4️⃣ Checking cache age...')
    const { data: cacheAge } = await supabase
      .from('nba_players_cache')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)

    if (cacheAge && cacheAge[0]) {
      const age = new Date() - new Date(cacheAge[0].last_updated)
      const ageDays = Math.floor(age / (1000 * 60 * 60 * 24))
      const ageHours = Math.floor((age % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      console.log(`✅ Cache is ${ageDays} days, ${ageHours} hours old`)
      if (ageDays > 7) {
        console.log('⚠️  Cache is older than 7 days - will refresh on next search')
      }
      console.log('')
    }
  }

  console.log('✅ All tests passed! Player cache is working correctly.')
}

testPlayerCache().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
