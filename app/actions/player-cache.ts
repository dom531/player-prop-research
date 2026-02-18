'use server'

import { createClient } from '@supabase/supabase-js'
import { findBestMatch } from 'string-similarity'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NBA_STATS_BASE = 'https://stats.nba.com/stats'
const NBA_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0',
  'Referer': 'https://www.nba.com/',
}

// Get current season
function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 10 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`
}

// Refresh player cache from NBA API
async function refreshPlayerCache() {
  try {
    const url = `${NBA_STATS_BASE}/commonallplayers?LeagueID=00&Season=${getCurrentSeason()}&IsOnlyCurrentSeason=0`
    const response = await fetch(url, { headers: NBA_HEADERS })
    const data = await response.json()
    const players = data.resultSets[0]?.rowSet || []

    // Transform and insert
    const playerRecords = players
      .filter((p: any[]) => Number(p[3]) === 1)
      .map((p: any[]) => ({
      id: String(p[0]),
      full_name: p[2],
      team: p[10] || p[9] || 'FA',
      is_active: true,
      last_updated: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('nba_players_cache')
      .upsert(playerRecords, { onConflict: 'id' })
    if (error) throw error

    console.log(`✅ Refreshed player cache: ${playerRecords.length} players`)
    return { success: true, count: playerRecords.length }
  } catch (error) {
    console.error('❌ Failed to refresh player cache:', error)
    return { success: false, error }
  }
}

// Get cached player list (fast)
export async function getPlayerList(): Promise<Array<{id: string, name: string, team: string}>> {
  const { data: cachedPlayers } = await supabase
    .from('nba_players_cache')
    .select('id, full_name, team, is_active, last_updated')
    .eq('is_active', true)
    .order('full_name')

  // Check if cache exists and is recent
  const existingCache = cachedPlayers || []
  const count = existingCache.length

  // Refresh if empty or older than 24 hours
  if (!existingCache || count === 0 ||
      (Date.now() - new Date(existingCache[0].last_updated).getTime() > 24 * 60 * 60 * 1000)) {
    const refreshed = await refreshPlayerCache()
    if (!refreshed.success && existingCache.length > 0) {
      return existingCache.map(p => ({ id: p.id, name: p.full_name, team: p.team }))
    }
  }

  // Return cached list
  const { data } = await supabase
    .from('nba_players_cache')
    .select('id, full_name, team')
    .eq('is_active', true)
    .order('full_name')

  return (data || []).map(p => ({ id: p.id, name: p.full_name, team: p.team }))
}

// Fast player ID lookup using cache
export async function findPlayerIdFast(playerName: string): Promise<string | null> {
  try {
    const players = await getPlayerList()

    // If no players loaded (cache empty/failed), return null to trigger fallback
    if (!players || players.length === 0) {
      console.warn('Player cache is empty, will use fallback API lookup')
      return null
    }

    // Exact match (case-insensitive)
    const exactMatch = players.find(p =>
      p.name.toLowerCase() === playerName.toLowerCase()
    )
    if (exactMatch) return exactMatch.id

    // Fuzzy match - only if we have players to match against
    const names = players.map(p => p.name)
    const bestMatch = findBestMatch(playerName, names)

    if (bestMatch.bestMatch.rating > 0.5) {
      const matchedPlayer = players[bestMatch.bestMatchIndex]
      console.log(`Fuzzy matched "${playerName}" to "${matchedPlayer.name}"`)
      return matchedPlayer.id
    }

    console.log(`No cache match found for "${playerName}"`)
    return null
  } catch (error) {
    console.error('Error in findPlayerIdFast:', error)
    return null
  }
}
