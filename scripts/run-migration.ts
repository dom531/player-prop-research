import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  try {
    console.log('🚀 Running database migration...')

    // Read SQL file
    const sqlPath = path.join(__dirname, '../migrations/create_player_cache_table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    console.log('📋 Created table: nba_players_cache')
    console.log('📋 Created indexes: idx_player_name, idx_active_players')

  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

runMigration()
