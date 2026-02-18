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

export type HomepageArcadeProp = {
  playerName: string
  propType: 'points' | 'rebounds' | 'assists'
  line: number
  bestBook: string
  edgeScore: number
  hitRate: number
  volatility: number
  sampleSize: number
  riskLevel: 'Low' | 'Medium' | 'High'
  game: {
    homeTeam: string
    awayTeam: string
    commenceTime: string
  }
}

export type HomepageArcadeGame = {
  gameId: string
  awayTeam: string
  homeTeam: string
  tipoffTime: string
  gameStatus: string
  topProps: HomepageArcadeProp[]
  allProps: HomepageArcadeProp[]
  proxyFlags: {
    hasLowVolatility: boolean
    hasStrongHitRate: boolean
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
  arcadeGames: HomepageArcadeGame[]
  injuries: InjuryItem[]
  schedule: ScheduleItem[]
  updatedAt: string
  sourceHealth: {
    trends: SourceHealth
    injuries: SourceHealth
    schedule: SourceHealth
  }
}
