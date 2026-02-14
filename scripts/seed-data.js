const fs = require('fs')
const csv = require('csv-parser')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase with Service Role for Write Access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CSV_FILE_PATH = './data/player_stats_export.csv' // Ensure this file exists
const BATCH_SIZE = 500

async function seed() {
  const results = []
  console.log(`🚀 Starting seed from ${CSV_FILE_PATH}...`)

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (data) => {
      // Map CSV columns to DB Schema
      // Ensure your CSV headers match these keys or adjust accordingly
      results.push({
        player_name: data.Player,
        team: data.Team,
        game_date: new Date(data.Date),
        opponent: data.Opp,
        is_home: data.Location !== '@', // Logic: If not '@', it's home
        minutes_played: parseInt(data.MP) || 0,
        points: parseInt(data.PTS) || 0,
        rebounds: parseInt(data.TRB) || 0,
        assists: parseInt(data.AST) || 0,
        usage_rate: parseFloat(data.USG_PCT) || 0,
      })
    })
    .on('end', async () => {
      console.log(`✅ Parsed ${results.length} rows. Uploading...`)

      for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('player_performance').insert(batch)

        if (error) {
          console.error(`❌ Batch error at index ${i}:`, error.message)
        } else {
          console.log(`✅ Uploaded batch ${i} to ${i + batch.length}`)
        }
      }
      console.log('🏁 Seeding complete.')
    })
}

seed()
