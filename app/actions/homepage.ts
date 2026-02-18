'use server'

import type {
  HomepageArcadeGame,
  HomepageArcadeProp,
  HomepagePayload,
  HomepageTrendItem,
  SourceHealth,
} from '@/types/homepage'
import { getHomepageTrends } from './homepage-trends'
import { getInjuries } from './injuries'
import { getSchedule } from './schedule'

const SECTION_TIMEOUT_MS = 7000

function toHealth(source: 'live' | 'cache', stale: boolean): SourceHealth {
  if (!stale) return 'ok'
  return source === 'cache' ? 'stale' : 'error'
}

type SectionResult<T> = { data: T[]; source: 'live' | 'cache'; stale: boolean }

async function withTimeout<T>(promise: Promise<SectionResult<T>>): Promise<SectionResult<T>> {
  let timer: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise<SectionResult<T>>((resolve) => {
    timer = setTimeout(() => {
      resolve({ data: [], source: 'cache', stale: true })
    }, SECTION_TIMEOUT_MS)
  })

  const result = await Promise.race([promise, timeoutPromise])
  if (timer) clearTimeout(timer)
  return result
}

function normalizeTeamName(team: string) {
  return team.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function gameIdFor(awayTeam: string, homeTeam: string, tipoffTime: string) {
  const datePart = tipoffTime?.slice(0, 10) || 'today'
  return `${normalizeTeamName(awayTeam)}-${normalizeTeamName(homeTeam)}-${datePart}`
}

function trendsToArcadeGames(
  trends: HomepageTrendItem[],
  schedule: HomepagePayload['schedule']
): HomepageArcadeGame[] {
  return schedule.map((game) => {
    const gameId = gameIdFor(game.awayTeam, game.homeTeam, game.tipoffTime)
    const awayKey = normalizeTeamName(game.awayTeam)
    const homeKey = normalizeTeamName(game.homeTeam)

    const relatedProps: HomepageArcadeProp[] = trends
      .filter((trend) => {
        const trendAway = normalizeTeamName(trend.game.awayTeam)
        const trendHome = normalizeTeamName(trend.game.homeTeam)
        return trendAway === awayKey && trendHome === homeKey
      })
      .map((trend) => ({
        playerName: trend.playerName,
        propType: trend.propType,
        line: trend.line,
        bestBook: trend.bestBook,
        edgeScore: trend.edgeScore,
        hitRate: trend.hitRate,
        volatility: trend.volatility,
        sampleSize: trend.sampleSize,
        riskLevel: trend.riskLevel,
        game: trend.game,
      }))
      .sort((a, b) => b.edgeScore - a.edgeScore)

    return {
      gameId,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      tipoffTime: game.tipoffTime,
      gameStatus: game.gameStatus,
      topProps: relatedProps.slice(0, 2),
      allProps: relatedProps,
      proxyFlags: {
        hasLowVolatility: relatedProps.some((prop) => prop.volatility < 35),
        hasStrongHitRate: relatedProps.some((prop) => prop.hitRate >= 60),
      },
    }
  })
}

export async function getHomepageData(params?: {
  forceRefresh?: boolean
}): Promise<HomepagePayload> {
  const forceRefresh = params?.forceRefresh ?? false

  const [trendsResult, injuriesResult, scheduleResult] = await Promise.allSettled([
    withTimeout(getHomepageTrends({ forceRefresh })),
    withTimeout(getInjuries({ forceRefresh })),
    withTimeout(getSchedule({ forceRefresh })),
  ])

  const trends = trendsResult.status === 'fulfilled' ? trendsResult.value : { data: [], source: 'cache' as const, stale: true }
  const injuries = injuriesResult.status === 'fulfilled' ? injuriesResult.value : { data: [], source: 'cache' as const, stale: true }
  const schedule = scheduleResult.status === 'fulfilled' ? scheduleResult.value : { data: [], source: 'cache' as const, stale: true }
  const arcadeGames = trendsToArcadeGames(trends.data, schedule.data)

  return {
    trends: trends.data,
    arcadeGames,
    injuries: injuries.data,
    schedule: schedule.data,
    updatedAt: new Date().toISOString(),
    sourceHealth: {
      trends: toHealth(trends.source, trends.stale),
      injuries: toHealth(injuries.source, injuries.stale),
      schedule: toHealth(schedule.source, schedule.stale),
    },
  }
}
