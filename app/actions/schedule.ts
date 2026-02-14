'use server'

import { createClient } from '@supabase/supabase-js'
import type { ScheduleItem } from '@/types/homepage'

const CACHE_WINDOW_MS = 15 * 60 * 1000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ScheduleCacheRow = {
  away_team: string
  home_team: string
  tipoff_time: string
  game_status: string
  game_date: string
  updated_at: string
}

function rowToItem(row: ScheduleCacheRow): ScheduleItem {
  return {
    awayTeam: row.away_team,
    homeTeam: row.home_team,
    tipoffTime: row.tipoff_time,
    gameStatus: row.game_status,
    gameDate: row.game_date,
  }
}

function getTodayDateKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

async function getRecentCacheRows() {
  const { data, error } = await supabase
    .from('homepage_schedule_cache')
    .select('*')
    .eq('sport', 'NBA')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Failed reading schedule cache:', error)
    return [] as ScheduleCacheRow[]
  }

  if (!data || data.length === 0) return [] as ScheduleCacheRow[]

  const newest = new Date(data[0].updated_at).getTime()
  return data.filter((row) => new Date(row.updated_at).getTime() === newest) as ScheduleCacheRow[]
}

async function fetchLiveSchedule() {
  const dateKey = getTodayDateKey()
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateKey}`,
    { next: { revalidate: 900 } }
  )

  if (!response.ok) {
    throw new Error(`Schedule endpoint failed: ${response.status}`)
  }

  const payload = await response.json()
  const events = Array.isArray(payload?.events) ? payload.events : []

  const items: ScheduleItem[] = []

  for (const event of events) {
    const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null
    const competitors = Array.isArray(competition?.competitors)
      ? competition.competitors
      : []

    const home = competitors.find((c: any) => c?.homeAway === 'home')
    const away = competitors.find((c: any) => c?.homeAway === 'away')

    if (!home || !away) continue

    items.push({
      awayTeam: away?.team?.displayName || away?.team?.abbreviation || 'Away',
      homeTeam: home?.team?.displayName || home?.team?.abbreviation || 'Home',
      tipoffTime: event?.date || new Date().toISOString(),
      gameStatus: competition?.status?.type?.shortDetail || event?.status?.type?.name || 'Scheduled',
      gameDate: (event?.date || new Date().toISOString()).slice(0, 10),
    })
  }

  return items
}

async function writeScheduleCache(items: ScheduleItem[]) {
  if (items.length === 0) return

  const now = new Date().toISOString()
  const rows = items.map((item) => ({
    sport: 'NBA',
    game_date: item.gameDate,
    away_team: item.awayTeam,
    home_team: item.homeTeam,
    tipoff_time: item.tipoffTime,
    game_status: item.gameStatus,
    updated_at: now,
  }))

  const { error } = await supabase.from('homepage_schedule_cache').insert(rows)
  if (error) {
    console.error('Failed writing schedule cache:', error)
  }
}

export async function getSchedule(params?: {
  forceRefresh?: boolean
}): Promise<{ data: ScheduleItem[]; source: 'live' | 'cache'; stale: boolean }> {
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
    const live = await fetchLiveSchedule()
    if (live.length > 0) {
      await writeScheduleCache(live)
      return {
        data: live,
        source: 'live',
        stale: false,
      }
    }
  } catch (error) {
    console.error('Failed fetching live schedule:', error)
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
