'use server'

import type { HomepagePayload, SourceHealth } from '@/types/homepage'
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

  return {
    trends: trends.data,
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
