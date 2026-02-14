const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupPlayerCache() {
  console.log('🚀 Setting up player cache table...')

  try {
    // Create the table using raw SQL
    const { error } = await supabase.rpc('exec_raw_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS nba_players_cache (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          team TEXT,
          is_active BOOLEAN DEFAULT true,
          last_updated TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_player_name ON nba_players_cache(full_name);
        CREATE INDEX IF NOT EXISTS idx_active_players ON nba_players_cache(is_active) WHERE is_active = true;
      `
    })

    if (error) {
      console.error('❌ Error creating table:', error.message)

      // Try alternative approach: check if table exists
      const { data, error: checkError } = await supabase
        .from('nba_players_cache')
        .select('id')
        .limit(1)

      if (checkError) {
        console.log('ℹ️ Table does not exist. Please run the SQL manually in Supabase dashboard:')
        console.log('\n--- Copy the SQL below ---\n')
        console.log(`CREATE TABLE IF NOT EXISTS nba_players_cache (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  team TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_name ON nba_players_cache(full_name);
CREATE INDEX IF NOT EXISTS idx_active_players ON nba_players_cache(is_active) WHERE is_active = true;`)
        console.log('\n--- End SQL ---\n')
        process.exit(1)
      } else {
        console.log('✅ Table already exists!')
      }
    } else {
      console.log('✅ Player cache table created successfully!')
    }

    console.log('✅ Setup complete! The player cache is ready.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

setupPlayerCache()
