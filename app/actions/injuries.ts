'use server'

import { createClient } from '@supabase/supabase-js'
import type { InjuryItem } from '@/types/homepage'

const CACHE_WINDOW_MS = 15 * 60 * 1000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type InjuryCacheRow = {
  player_name: string
  team: string
  injury: string
  status: string
  updated_at: string
  source: string
}

function normalizeStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (!normalized) return 'Unknown'
  return normalized
}

function rowToItem(row: InjuryCacheRow): InjuryItem {
  return {
    playerName: row.player_name,
    team: row.team,
    injury: row.injury,
    status: row.status,
    updatedAt: row.updated_at,
    source: row.source,
  }
}

async function getRecentCacheRows() {
  const { data, error } = await supabase
    .from('homepage_injuries_cache')
    .select('*')
    .eq('sport', 'NBA')
    .order('updated_at', { ascending: false })
    .limit(250)

  if (error) {
    console.error('Failed reading injuries cache:', error)
    return [] as InjuryCacheRow[]
  }

  return (data || []) as InjuryCacheRow[]
}

async function fetchLiveInjuries() {
  const response = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries',
    { next: { revalidate: 900 } }
  )

  if (!response.ok) {
    throw new Error(`Injuries endpoint failed: ${response.status}`)
  }

  const payload = await response.json()
  const items: InjuryItem[] = []

  const rootEntries = Array.isArray(payload?.injuries) ? payload.injuries : []

  const pushInjury = (entry: any, fallbackTeam?: string) => {
    const athlete = entry?.athlete || entry?.player || {}
    const team = entry?.team || {}
    const details = Array.isArray(entry?.details) ? entry.details[0] : null
    const playerName =
      athlete?.displayName || entry?.playerName || entry?.name || entry?.athlete?.fullName
    if (!playerName) return

    items.push({
      playerName,
      team: fallbackTeam || team?.displayName || team?.abbreviation || 'NBA',
      injury:
        details?.type ||
        details?.description ||
        entry?.shortComment ||
        entry?.longComment ||
        'Injury',
      status: normalizeStatus(
        details?.status || entry?.status?.type?.description || entry?.status || 'unknown'
      ),
      updatedAt: details?.date || entry?.date || payload?.timestamp || new Date().toISOString(),
      source: 'ESPN',
    })
  }

  for (const entry of rootEntries) {
    if (Array.isArray(entry?.injuries)) {
      const teamName = entry?.displayName || entry?.team?.displayName || 'NBA'
      for (const injury of entry.injuries) {
        pushInjury(injury, teamName)
      }
      continue
    }
    pushInjury(entry)
  }

  const dedupedByPlayer = new Map<string, InjuryItem>()
  for (const item of items) {
    dedupedByPlayer.set(item.playerName.toLowerCase(), item)
  }

  return Array.from(dedupedByPlayer.values())
}

async function writeInjuriesCache(items: InjuryItem[]) {
  if (items.length === 0) return

  const rows = items.map((item) => ({
    sport: 'NBA',
    player_name: item.playerName,
    team: item.team,
    injury: item.injury,
    status: item.status,
    updated_at: item.updatedAt,
    source: item.source,
  }))

  const { error } = await supabase.from('homepage_injuries_cache').insert(rows)
  if (error) {
    console.error('Failed writing injuries cache:', error)
  }
}

export async function getInjuries(params?: {
  forceRefresh?: boolean
}): Promise<{ data: InjuryItem[]; source: 'live' | 'cache'; stale: boolean }> {
  const forceRefresh = params?.forceRefresh ?? false
  const cachedRows = await getRecentCacheRows()
  const hasFreshCache =
    cachedRows.length > 0 &&
    Date.now() - new Date(cachedRows[0].updated_at).getTime() < CACHE_WINDOW_MS

  if (!forceRefresh && hasFreshCache) {
    return {
      data: cachedRows.map(rowToItem),
      source: 'cache',
      stale: false,
    }
  }

  try {
    const live = await fetchLiveInjuries()
    if (live.length > 0) {
      await writeInjuriesCache(live)
      return {
        data: live,
        source: 'live',
        stale: false,
      }
    }
  } catch (error) {
    console.error('Failed fetching live injuries:', error)
  }

  if (cachedRows.length > 0) {
    return {
      data: cachedRows.map(rowToItem),
      source: 'cache',
      stale: true,
    }
  }

  return {
    data: [],
    source: 'cache',
    stale: true,
  }
}
