export type SourceHealth = 'ok' | 'stale' | 'error'

export type HomepageTrendItem = {
  playerName: string
  team: string
  propType: 'points' | 'rebounds' | 'assists'
  line: number
  bestBook: string
  overOdds: number
  hitRate: number
  consistency: number
  volatility: number
  edgeScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  sampleSize: number
  game: {
    homeTeam: string
    awayTeam: string
    commenceTime: string
  }
}

export type InjuryItem = {
  playerName: string
  team: string
  injury: string
  status: string
  updatedAt: string
  source: string
}

export type ScheduleItem = {
  awayTeam: string
  homeTeam: string
  tipoffTime: string
  gameStatus: string
  gameDate: string
}

export type HomepagePayload = {
  trends: HomepageTrendItem[]
  injuries: InjuryItem[]
  schedule: ScheduleItem[]
  updatedAt: string
  sourceHealth: {
    trends: SourceHealth
    injuries: SourceHealth
    schedule: SourceHealth
  }
}
