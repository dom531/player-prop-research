'use server'

import { createClient } from '@supabase/supabase-js'
import type { HomepageTrendItem } from '@/types/homepage'

const CACHE_WINDOW_MS = 15 * 60 * 1000
const TOP_N_DEFAULT = 12
const MIN_SAMPLE_SIZE = 5

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
  'Shai Gilgeous-Alexander',
  'Devin Booker',
  'Tyrese Haliburton',
  'Donovan Mitchell',
]

const MARKET_TO_PROP: Record<string, HomepageTrendItem['propType']> = {
  player_points: 'points',
  player_rebounds: 'rebounds',
  player_assists: 'assists',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type TrendCacheRow = {
  sport: string
  as_of: string
  player_name: string
  team: string
  prop_type: string
  line: number
  best_book: string
  over_odds: number
  hit_rate: number
  consistency: number
  volatility: number
  edge_score: number
  risk_level: string
  sample_size: number
  meta_json: {
    game?: {
      homeTeam: string
      awayTeam: string
      commenceTime: string
    }
  }
}

type OddsEvent = {
  home_team: string
  away_team: string
  commence_time: string
  bookmakers?: Array<{
    title: string
    markets?: Array<{
      key: string
      outcomes?: Array<{
        name: string
        description?: string
        point?: number
        price?: number
      }>
    }>
  }>
}

function toTitleCase(s: string) {
  return s
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function normalizePlayerName(raw: string) {
  return toTitleCase(raw.replace(/\./g, '').trim())
}

function getRiskLevel(edgeScore: number): 'Low' | 'Medium' | 'High' {
  if (edgeScore >= 70) return 'Low'
  if (edgeScore >= 50) return 'Medium'
  return 'High'
}

function computeConsistencyAndVolatility(values: number[]) {
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  if (avg === 0) {
    return { consistency: 0, volatility: 100 }
  }

  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const volatility = (stdDev / avg) * 100
  const consistency = Math.max(0, 100 - volatility)

  return {
    consistency: Number(consistency.toFixed(1)),
    volatility: Number(volatility.toFixed(1)),
  }
}

function computeMomentum(values: number[]) {
  if (values.length < 5) return 0
  const recent = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const baseline = values.slice(3).reduce((a, b) => a + b, 0) / (values.length - 3)
  if (baseline === 0) return 0
  return ((recent - baseline) / baseline) * 100
}

function computeEdgeScore(params: {
  hitRate: number
  consistency: number
  volatility: number
  momentum: number
  sampleSize: number
}) {
  const w1 = 0.45
  const w2 = 0.30
  const w3 = 0.15
  const w4 = 0.10
  const samplePenalty = params.sampleSize < 8 ? (8 - params.sampleSize) * 2 : 0

  const score =
    params.hitRate * w1 +
    params.consistency * w2 -
    params.volatility * w3 +
    params.momentum * w4 -
    samplePenalty

  return Number(Math.max(0, Math.min(100, score)).toFixed(1))
}

function rowToTrendItem(row: TrendCacheRow): HomepageTrendItem {
  return {
    playerName: row.player_name,
    team: row.team,
    propType: row.prop_type as HomepageTrendItem['propType'],
    line: row.line,
    bestBook: row.best_book,
    overOdds: row.over_odds,
    hitRate: row.hit_rate,
    consistency: row.consistency,
    volatility: row.volatility,
    edgeScore: row.edge_score,
    riskLevel: row.risk_level as HomepageTrendItem['riskLevel'],
    sampleSize: row.sample_size,
    game: {
      homeTeam: row.meta_json?.game?.homeTeam || 'TBD',
      awayTeam: row.meta_json?.game?.awayTeam || 'TBD',
      commenceTime: row.meta_json?.game?.commenceTime || new Date().toISOString(),
    },
  }
}

async function getRecentCacheRows() {
  const { data, error } = await supabase
    .from('homepage_trends_cache')
    .select('*')
    .eq('sport', 'NBA')
    .order('as_of', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Failed reading trends cache:', error)
    return [] as TrendCacheRow[]
  }

  if (!data || data.length === 0) return [] as TrendCacheRow[]

  const newest = new Date(data[0].as_of).getTime()
  return data.filter((row) => new Date(row.as_of).getTime() === newest) as TrendCacheRow[]
}

async function fetchOddsBoard() {
  const apiKey = process.env.THE_ODDS_API_KEY
  if (!apiKey) return [] as OddsEvent[]

  const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${apiKey}&regions=us&markets=player_points,player_rebounds,player_assists&oddsFormat=american`
  const response = await fetch(url, { next: { revalidate: 900 } })
  if (!response.ok) {
    console.error('Odds board fetch failed:', response.status)
    return [] as OddsEvent[]
  }

  const json = await response.json()
  return Array.isArray(json) ? (json as OddsEvent[]) : []
}

function extractBestLines(events: OddsEvent[]) {
  const bestByKey = new Map<
    string,
    {
      playerName: string
      propType: HomepageTrendItem['propType']
      line: number
      overOdds: number
      bestBook: string
      team: string
      game: HomepageTrendItem['game']
    }
  >()

  for (const event of events) {
    for (const book of event.bookmakers || []) {
      for (const market of book.markets || []) {
        const propType = MARKET_TO_PROP[market.key]
        if (!propType) continue

        for (const outcome of market.outcomes || []) {
          if (outcome.name?.toLowerCase() !== 'over') continue
          if (!outcome.description || outcome.point === undefined) continue

          const playerName = normalizePlayerName(outcome.description)
          const key = `${playerName}|${propType}`
          const existing = bestByKey.get(key)

          const nextCandidate = {
            playerName,
            propType,
            line: outcome.point,
            overOdds: outcome.price ?? 0,
            bestBook: book.title,
            team: event.home_team.includes(playerName.split(' ').at(-1) || '')
              ? event.home_team
              : event.away_team,
            game: {
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              commenceTime: event.commence_time,
            },
          }

          if (!existing || nextCandidate.line < existing.line) {
            bestByKey.set(key, nextCandidate)
          }
        }
      }
    }
  }

  return bestByKey
}

async function computeFreshTrends(limit: number) {
  const oddsBoard = await fetchOddsBoard()
  const bestLines = extractBestLines(oddsBoard)

  const trends: HomepageTrendItem[] = []

  for (const playerName of TRACKED_PLAYERS) {
    for (const propType of ['points', 'rebounds', 'assists'] as const) {
      const lineEntry = bestLines.get(`${playerName}|${propType}`)
      if (!lineEntry) continue

      const { data: statsData, error: statsError } = await supabase
        .from('player_performance')
        .select('*')
        .ilike('player_name', playerName)
        .order('game_date', { ascending: false })
        .limit(10)

      if (statsError || !statsData || statsData.length < MIN_SAMPLE_SIZE) continue

      const values = statsData.map((game) => {
        if (propType === 'points') return game.points || 0
        if (propType === 'rebounds') return game.rebounds || 0
        return game.assists || 0
      })

      const hitRate =
        (values.filter((value) => value > lineEntry.line).length / values.length) * 100
      const { consistency, volatility } = computeConsistencyAndVolatility(values)
      const momentum = computeMomentum(values)
      const edgeScore = computeEdgeScore({
        hitRate,
        consistency,
        volatility,
        momentum,
        sampleSize: values.length,
      })

      trends.push({
        playerName,
        team: statsData[0].team || 'NBA',
        propType,
        line: lineEntry.line,
        bestBook: lineEntry.bestBook,
        overOdds: lineEntry.overOdds,
        hitRate: Number(hitRate.toFixed(1)),
        consistency,
        volatility,
        edgeScore,
        riskLevel: getRiskLevel(edgeScore),
        sampleSize: values.length,
        game: lineEntry.game,
      })
    }
  }

  trends.sort((a, b) => b.edgeScore - a.edgeScore)
  return trends.slice(0, limit)
}

async function writeTrendCache(trends: HomepageTrendItem[]) {
  if (trends.length === 0) return

  const now = new Date().toISOString()
  const rows = trends.map((trend) => ({
    sport: 'NBA',
    as_of: now,
    player_name: trend.playerName,
    team: trend.team,
    prop_type: trend.propType,
    line: trend.line,
    best_book: trend.bestBook,
    over_odds: trend.overOdds,
    hit_rate: trend.hitRate,
    consistency: trend.consistency,
    volatility: trend.volatility,
    edge_score: trend.edgeScore,
    risk_level: trend.riskLevel,
    sample_size: trend.sampleSize,
    meta_json: {
      game: trend.game,
    },
  }))

  const { error } = await supabase.from('homepage_trends_cache').insert(rows)
  if (error) {
    console.error('Failed writing trends cache:', error)
  }
}

export async function getHomepageTrends(params?: {
  limit?: number
  forceRefresh?: boolean
}): Promise<{ data: HomepageTrendItem[]; source: 'live' | 'cache'; stale: boolean }> {
  const limit = params?.limit ?? TOP_N_DEFAULT
  const forceRefresh = params?.forceRefresh ?? false

  const cachedRows = await getRecentCacheRows()
  const hasFreshCache =
    cachedRows.length > 0 &&
    Date.now() - new Date(cachedRows[0].as_of).getTime() < CACHE_WINDOW_MS

  if (!forceRefresh && hasFreshCache) {
    return {
      data: cachedRows.slice(0, limit).map(rowToTrendItem),
      source: 'cache',
      stale: false,
    }
  }

  try {
    const fresh = await computeFreshTrends(limit)
    if (fresh.length > 0) {
      await writeTrendCache(fresh)
      return {
        data: fresh,
        source: 'live',
        stale: false,
      }
    }
  } catch (error) {
    console.error('Failed computing homepage trends:', error)
  }

  if (cachedRows.length > 0) {
    return {
      data: cachedRows.slice(0, limit).map(rowToTrendItem),
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
