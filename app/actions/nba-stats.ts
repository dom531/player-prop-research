'use server'

import { createClient } from '@supabase/supabase-js'
import { findBestMatch } from 'string-similarity'
import { findPlayerIdFast, getPlayerList } from './player-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// NBA Stats API endpoints (free, unofficial)
const NBA_STATS_BASE = 'https://stats.nba.com/stats'

const NBA_HEADERS = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com',
}

// Get current NBA season
function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // NBA season starts in October
  if (month >= 10) {
    return `${year}-${String(year + 1).slice(2)}`
  } else {
    return `${year - 1}-${String(year).slice(2)}`
  }
}

// Fetch player's recent games
export async function fetchPlayerRecentGames(playerName: string, limit: number = 10) {
  try {
    // Step 1: Search for player ID
    const playerId = await findPlayerId(playerName)
    if (!playerId) {
      throw new Error('Player not found')
    }

    // Step 2: Get player's game log
    const season = getCurrentSeason()
    const url = `${NBA_STATS_BASE}/playergamelog?PlayerID=${playerId}&Season=${season}&SeasonType=Regular+Season`

    const response = await fetch(url, {
      headers: NBA_HEADERS,
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error('Failed to fetch player stats')
    }

    const data = await response.json()
    const games = data.resultSets[0]?.rowSet || []
    const headers = data.resultSets[0]?.headers || []

    // Parse games
    const recentGames = games.slice(0, limit).map((game: any[]) => {
      const gameData: any = {}
      headers.forEach((header: string, index: number) => {
        gameData[header] = game[index]
      })

      return {
        player_name: playerName,
        team: gameData.TEAM_ABBREVIATION,
        game_date: gameData.GAME_DATE,
        opponent: gameData.MATCHUP?.split(' ')[2] || 'Unknown', // Extract opponent from "LAL vs. GSW"
        is_home: !gameData.MATCHUP?.includes('@'),
        minutes_played: parseInt(gameData.MIN) || 0,
        points: parseInt(gameData.PTS) || 0,
        rebounds: parseInt(gameData.REB) || 0,
        assists: parseInt(gameData.AST) || 0,
        usage_rate: parseFloat(gameData.USG_PCT) || 0,
      }
    })

    return recentGames
  } catch (error) {
    console.error('Error fetching NBA stats:', error)
    throw error
  }
}

// Fallback: Original NBA API player lookup (used when cache fails)
async function findPlayerIdFromAPI(playerName: string): Promise<string | null> {
  try {
    const url = `${NBA_STATS_BASE}/commonallplayers?LeagueID=00&Season=${getCurrentSeason()}&IsOnlyCurrentSeason=1`

    const response = await fetch(url, {
      headers: NBA_HEADERS,
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    const data = await response.json()
    const players = data.resultSets[0]?.rowSet || []

    // Search for player by name (case-insensitive substring match)
    const matches = players.filter((p: any[]) =>
      p[2]?.toLowerCase().includes(playerName.toLowerCase())
    )

    if (matches.length === 0) {
      console.error(`No players found matching "${playerName}"`)
      return null
    }

    if (matches.length === 1) {
      // Exact match
      return String(matches[0][0])
    }

    // Multiple matches - use fuzzy matching to find best
    console.log(`Multiple players found for "${playerName}":`, matches.map((p: any[]) => p[2]))

    const names = matches.map((p: any[]) => p[2])
    const bestMatch = findBestMatch(playerName, names)
    const bestPlayer = matches[bestMatch.bestMatchIndex]

    console.log(`Using fuzzy match: ${bestPlayer[2]}`)
    return String(bestPlayer[0])
  } catch (error) {
    console.error('Error finding player from API:', error)
    return null
  }
}

// Find player ID by name (with fuzzy matching)
// Tries cache first (fast), falls back to NBA API if cache fails
export async function findPlayerId(playerName: string): Promise<string | null> {
  // Try cache first (50x faster when working)
  try {
    const cachedId = await findPlayerIdFast(playerName)
    if (cachedId) {
      console.log(`✅ Found player in cache: ${playerName}`)
      return cachedId
    }
  } catch (error) {
    console.warn('Cache lookup failed, falling back to API:', error)
  }

  // Fallback to NBA API (slower but always works)
  console.log(`⚠️ Cache miss, using NBA API for: ${playerName}`)
  return findPlayerIdFromAPI(playerName)
}

// Get player headshot photo
export async function getPlayerPhoto(playerName: string): Promise<string> {
  try {
    const playerId = await findPlayerId(playerName)
    if (!playerId) {
      return '/placeholder-player.svg' // Fallback
    }

    // NBA official headshot URL
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`
  } catch (error) {
    console.error('Error fetching player photo:', error)
    return '/placeholder-player.svg'
  }
}

// Update database with latest games
export async function updatePlayerData(playerName: string) {
  try {
    // Fetch latest games from NBA API
    const games = await fetchPlayerRecentGames(playerName, 20)

    if (games.length === 0) {
      return { success: false, message: 'No games found' }
    }

    // Delete old data for this player
    await supabase
      .from('player_performance')
      .delete()
      .eq('player_name', playerName)

    // Insert new data
    const { error } = await supabase
      .from('player_performance')
      .insert(games)

    if (error) {
      throw error
    }

    return {
      success: true,
      message: `Updated ${games.length} games for ${playerName}`,
      gamesAdded: games.length
    }
  } catch (error) {
    console.error('Error updating player data:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Update failed'
    }
  }
}

// Auto-update multiple players
export async function autoUpdatePlayers(playerNames: string[]) {
  const results = []

  for (const name of playerNames) {
    const result = await updatePlayerData(name)
    results.push({ player: name, ...result })

    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}
