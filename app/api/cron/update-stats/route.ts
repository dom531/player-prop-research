import { NextResponse } from 'next/server'
import { autoUpdatePlayers } from '@/app/actions/nba-stats'

// List of players to auto-update
const TRACKED_PLAYERS = [
  'LeBron James',
  'Stephen Curry',
  'Kevin Durant',
  'Giannis Antetokounmpo',
  'Luka Doncic',
  'Joel Embiid',
  'Nikola Jokic',
  'Jayson Tatum',
  'Damian Lillard',
  'Anthony Davis',
  // Add more players as needed
]

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting automatic player data update...')

    // Update all tracked players
    const results = await autoUpdatePlayers(TRACKED_PLAYERS)

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      playersUpdated: successCount,
      playersFailed: failCount,
      details: results,
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
