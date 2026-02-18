'use server'

import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { updatePlayerData, getPlayerPhoto } from './nba-stats'
import { getMatchupData, type MatchupInsight } from './matchup-data'

// Initialize Clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type Definitions
type OddsData = {
  bestLine: {
    sportsbook: string
    line: number
    overOdds: number
    description: string
  }
  allLines: Array<{
    sportsbook: string
    line: number
    overOdds: number
    description: string
  }>
  consensus: string | null
  game: {
    homeTeam: string
    awayTeam: string
    commence_time: string
  }
} | null

export type ResearchResult = {
  stats: any[]
  odds: OddsData
  analysis: string
  playerPhoto: string
  propType: string
  hasActiveProp: boolean
  matchupInsight?: MatchupInsight
  advancedMetrics?: {
    consistency: number
    trendDirection: string
    volatility: number
    recentMomentum: string
  }
  riskScore?: {
    score: number
    level: string
    factors: string[]
  }
}

const STATS_REFRESH_THRESHOLD_MS = 72 * 60 * 60 * 1000
const ODDS_TIMEOUT_MS = 4000
const MATCHUP_TIMEOUT_MS = 4000
const OPENAI_TIMEOUT_MS = 6000
const STATS_REFRESH_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

function getCurrentSeasonStart() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const seasonStartYear = month >= 10 ? year : year - 1
  return new Date(Date.UTC(seasonStartYear, 9, 1, 0, 0, 0))
}

function parseGameDate(value: unknown): Date | null {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function shouldRefreshPlayerStats(rows: any[]): boolean {
  if (!rows || rows.length === 0) return true

  const latestGameDate = rows
    .map((row) => parseGameDate(row.game_date))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0]

  if (!latestGameDate) return true
  if (latestGameDate < getCurrentSeasonStart()) return true

  return Date.now() - latestGameDate.getTime() > STATS_REFRESH_THRESHOLD_MS
}

// Helper: Calculate consensus line from multiple books
function calculateConsensus(lines: any[]) {
  if (lines.length === 0) return null
  const avgLine = lines.reduce((sum, l) => sum + l.line, 0) / lines.length
  return avgLine.toFixed(1)
}

// 1. Helper: Fetch Live Odds (REWRITTEN - now searches for specific player)
async function fetchLiveOdds(playerName: string, propType: string = 'points') {
  try {
    const apiKey = process.env.THE_ODDS_API_KEY
    if (!apiKey) {
      console.warn('No Odds API key configured')
      return null
    }

    // Combo props (PRA, PR, PA, RA) don't have markets in The Odds API
    // Return null to show Research Mode instead
    const comboProps = ['pra', 'pr', 'pa', 'ra']
    if (comboProps.includes(propType.toLowerCase())) {
      console.log(`No odds available for combo prop: ${propType.toUpperCase()}`)
      return null
    }

    // Map prop types to Odds API market keys
    const marketMap: Record<string, string> = {
      points: 'player_points',
      rebounds: 'player_rebounds',
      assists: 'player_assists'
    }

    const market = marketMap[propType]
    if (!market) {
      console.warn(`No market mapping for prop type: ${propType}`)
      return null
    }

    const sport = 'basketball_nba'

    // Step 1: Get all upcoming games
    const gamesUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}`
    const gamesRes = await fetchWithTimeout(gamesUrl, { next: { revalidate: 300 } }, 2000)

    if (!gamesRes.ok) {
      console.error('Odds API games fetch failed:', gamesRes.status)
      return null
    }

    const games = await gamesRes.json()

    if (!Array.isArray(games) || games.length === 0) {
      console.warn('No upcoming NBA games found')
      return null
    }

    // Extract last name for better matching
    const lastName = playerName.split(' ').pop()?.toLowerCase() || playerName.toLowerCase()

    // Step 2: Search through all games for player-specific props
    for (const game of games.slice(0, 8)) {
      try {
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=${market}`
        const oddsRes = await fetchWithTimeout(oddsUrl, { next: { revalidate: 300 } }, 1500)

        if (!oddsRes.ok) continue

        const oddsData = await oddsRes.json()
        const allLines: any[] = []

        // Step 3: Search through bookmakers and markets for this specific player
        for (const bookmaker of oddsData.bookmakers || []) {
          for (const marketData of bookmaker.markets || []) {
            if (marketData.key !== market) continue

            for (const outcome of marketData.outcomes || []) {
              // CRITICAL: Match player by name in outcome description
              const outcomeDescription = outcome.description?.toLowerCase() || ''
              const outcomeName = outcome.name?.toLowerCase() || ''

              // Match if: description contains last name OR name is "Over" with matching description
              if (outcomeDescription.includes(lastName) && (outcomeName === 'over' || outcomeName.includes(lastName))) {
                allLines.push({
                  sportsbook: bookmaker.title,
                  line: outcome.point,
                  overOdds: outcome.price,
                  description: outcome.description
                })
              }
            }
          }
        }

        // If we found lines for this player, return them
        if (allLines.length > 0) {
          // Sort by line value (lowest first = best for Over bettors)
          allLines.sort((a, b) => a.line - b.line)

          return {
            bestLine: allLines[0],
            allLines: allLines,
            consensus: calculateConsensus(allLines),
            game: {
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              commence_time: game.commence_time
            }
          }
        }
      } catch (gameError) {
        console.error(`Error fetching odds for game ${game.id}:`, gameError)
        continue
      }
    }

    // No lines found for this player across any games
    console.log(`No ${propType} props found for ${playerName}`)
    return null

  } catch (e) {
    console.error('Odds Fetch Error:', e)
    return null
  }
}

// 2. Main Action: The "Brain" (UPDATED - now handles prop types and null odds)
export async function getPlayerResearch(playerName: string, propType: string = 'points'): Promise<ResearchResult> {
  const timeoutNotes: string[] = []

  // A. Read cached stats from database
  let statsResponse = await supabase
    .from('player_performance')
    .select('*')
    .ilike('player_name', playerName)
    .order('game_date', { ascending: false })
    .limit(10)

  const cachedStats = statsResponse.data || []
  const needsRefresh = shouldRefreshPlayerStats(cachedStats)

  // B. Refresh stale or missing data from NBA API
  if (needsRefresh) {
    console.log(`Refreshing player data for ${playerName} (missing or stale)...`)

    try {
      const refreshResult = await withTimeout(
        updatePlayerData(playerName),
        STATS_REFRESH_TIMEOUT_MS,
        { success: false, message: 'timeout' }
      )
      if (!refreshResult.success && refreshResult.message === 'timeout') {
        timeoutNotes.push('Stats refresh timed out; using cached stats.')
      }

      // Reload stats after refresh attempt
      statsResponse = await supabase
        .from('player_performance')
        .select('*')
        .ilike('player_name', playerName)
        .order('game_date', { ascending: false })
        .limit(10)
    } catch (error) {
      console.error('Failed to fetch NBA data:', error)
    }
  }

  const stats = statsResponse.data || []

  // C. Parallel fetch of odds and photo
  const [odds, playerPhoto] = await Promise.all([
    withTimeout(fetchLiveOdds(playerName, propType), ODDS_TIMEOUT_MS, null).then((data) => {
      if (data === null) {
        timeoutNotes.push('Odds lookup timed out or no active market was found.')
      }
      return data
    }),
    getPlayerPhoto(playerName)
  ])

  // D. If still no stats, return error
  if (stats.length === 0) {
    return {
      stats: [],
      odds,
      playerPhoto: '/placeholder-player.svg',
      analysis: `**No data available for "${playerName}"**\n\nPlease check:\n- Player name spelling\n- Player is currently active in the NBA\n- Try searching by full name (e.g., "LeBron James")`,
      propType,
      hasActiveProp: false,
      matchupInsight: undefined,
      advancedMetrics: undefined,
      riskScore: undefined
    }
  }

  // E. Determine target metric based on prop type
  const metricMap: Record<string, string> = {
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists'
  }

  // Helper function to calculate combo prop values
  const getStatValue = (game: any, propType: string): number => {
    switch (propType) {
      case 'points':
        return game.points || 0
      case 'rebounds':
        return game.rebounds || 0
      case 'assists':
        return game.assists || 0
      case 'pra':
        return (game.points || 0) + (game.rebounds || 0) + (game.assists || 0)
      case 'pr':
        return (game.points || 0) + (game.rebounds || 0)
      case 'pa':
        return (game.points || 0) + (game.assists || 0)
      case 'ra':
        return (game.rebounds || 0) + (game.assists || 0)
      default:
        return game.points || 0
    }
  }

  const targetMetric = metricMap[propType] || 'points'
  const isComboStat = ['pra', 'pr', 'pa', 'ra'].includes(propType)

  // F. Calculate stats for the target metric
  const avgValue = stats.reduce((sum, g) => sum + getStatValue(g, propType), 0) / stats.length
  const recentForm = stats.slice(0, 3).map(g => getStatValue(g, propType)).join(', ')

  // F1. Calculate advanced metrics
  const values = stats.map(g => getStatValue(g, propType))
  const avgRecent3 = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const avgPrevious7 = values.slice(3, 10).reduce((a, b) => a + b, 0) / Math.min(7, values.slice(3, 10).length)

  const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avgValue, 2), 0) / values.length)
  const consistency = Math.max(0, 100 - (stdDev / avgValue * 100))
  const volatility = parseFloat((stdDev / avgValue * 100).toFixed(1))

  const trendDirection = avgRecent3 > avgPrevious7 ? 'Trending Up ↗' :
                         avgRecent3 < avgPrevious7 ? 'Trending Down ↘' : 'Stable →'
  const recentMomentum = avgRecent3 > avgValue ? 'Hot 🔥' :
                         avgRecent3 < avgValue ? 'Cold ❄️' : 'Average'

  const advancedMetrics = {
    consistency: parseFloat(consistency.toFixed(1)),
    trendDirection,
    volatility,
    recentMomentum
  }

  // F2. Get matchup data if odds are available
  let matchupInsight: MatchupInsight | undefined
  if (odds) {
    const opponent = odds.game.homeTeam // or awayTeam based on player's team
    const fallbackInsight: MatchupInsight = {
      opponentRank: null,
      defenseVsPosRank: null,
      pace: null,
      interpretation: 'Matchup lookup timed out'
    }
    const insightResult = await withTimeout(
      getMatchupData(playerName, opponent, propType),
      MATCHUP_TIMEOUT_MS,
      fallbackInsight
    )
    if (insightResult.interpretation === fallbackInsight.interpretation) {
      timeoutNotes.push('Matchup data timed out.')
      matchupInsight = undefined
    } else {
      matchupInsight = insightResult
    }
  }

  // F3. Calculate risk score
  let riskScore: { score: number; level: string; factors: string[] } | undefined
  if (odds) {
    const factors: string[] = []
    let riskPoints = 0

    // Consistency factor
    if (advancedMetrics.consistency < 60) {
      riskPoints += 3
      factors.push('High volatility in performance')
    } else if (advancedMetrics.consistency < 75) {
      riskPoints += 1
      factors.push('Moderate performance variance')
    }

    // Hit rate factor - use DraftKings line
    const draftkingsLine = odds.allLines.find(l =>
      l.sportsbook.toLowerCase().includes('draftkings')
    )
    const riskCurrentLine = draftkingsLine?.line || odds.bestLine.line
    const overCount = stats.filter(g => getStatValue(g, propType) > riskCurrentLine).length
    const hitRateValue = (overCount / stats.length) * 100

    if (hitRateValue < 40) {
      riskPoints += 3
      factors.push('Low historical hit rate vs line')
    } else if (hitRateValue > 70) {
      riskPoints -= 1
      factors.push('Strong historical hit rate')
    }

    // Recent form factor
    if (advancedMetrics.recentMomentum === 'Cold ❄️') {
      riskPoints += 2
      factors.push('Recent performance below average')
    } else if (advancedMetrics.recentMomentum === 'Hot 🔥') {
      riskPoints -= 1
      factors.push('Hot recent streak')
    }

    // Sample size factor
    if (stats.length < 5) {
      riskPoints += 2
      factors.push('Limited sample size')
    }

    // Matchup factor
    if (matchupInsight?.opponentRank && matchupInsight.opponentRank <= 10) {
      riskPoints += 2
      factors.push('Elite opposing defense')
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.max(0, Math.min(100, 50 + (riskPoints * 10)))

    let riskLevel = 'Low'
    if (normalizedScore >= 70) riskLevel = 'High'
    else if (normalizedScore >= 40) riskLevel = 'Medium'

    riskScore = {
      score: normalizedScore,
      level: riskLevel,
      factors: factors.length > 0 ? factors : ['Standard risk profile']
    }
  }

  // G. Construct Context for LLM based on whether odds are available
  let systemPrompt = ''
  let userPrompt = ''

  if (odds) {
    // BETTING MODE: We have live odds
    // Extract DraftKings line specifically (not lowest line)
    const draftkingsLine = odds.allLines.find(l =>
      l.sportsbook === 'DraftKings' ||
      l.sportsbook === 'draftkings' ||
      l.sportsbook.toLowerCase().includes('draftkings')
    )
    const currentLine = draftkingsLine?.line || odds.consensus || odds.bestLine.line
    const comparisonBook = draftkingsLine ? 'DraftKings' : (odds.consensus ? 'Consensus' : odds.bestLine.sportsbook)
    const overCount = stats.filter(g => getStatValue(g, propType) > currentLine).length
    const hitRate = ((overCount / stats.length) * 100).toFixed(0)

    systemPrompt = `
    You are an Elite Sharp Sports Bettor with access to advanced analytics. Find statistical edges between data and the market line.

    CRITICAL ANALYSIS FACTORS:
    1. **Consistency Score**: Higher score (>80) = more reliable, lower volatility. Under 60 = high variance, risky.
    2. **Trend Analysis**: Momentum direction matters. Recent form > season average for active props.
    3. **Hit Rate vs Line**: Must exceed 60% to justify Over. Under 40% suggests Under or Pass.
    4. **Matchup Context**: Defense ranking, pace, and positional matchups create edges.
    5. **Line Value**: Compare best line vs consensus. 0.5+ point difference = significant edge.
    6. **Volume**: Usage rate >28% = primary option (reliable). <20% = secondary (volatile).

    OUTPUT STRUCTURE:
    ## 📊 Key Metrics
    [Bullet points: consistency, trend, hit rate, matchup advantage]

    ## 🎯 Edge Analysis
    [2-3 sentences on where the edge exists or doesn't]

    ## 💡 Verdict
    **[LEAN OVER / LEAN UNDER / PASS]** - [One sentence rationale]

    Keep it sharp, data-driven, and actionable. No fluff.
    `

    userPrompt = `
    **Player**: ${playerName}
    **Prop Type**: ${propType.toUpperCase()}
    **Line**: ${currentLine} at ${comparisonBook}
    ${draftkingsLine ? `(DraftKings specific line)` : `(DraftKings unavailable, using ${comparisonBook})`}
    **Market**: ${odds.allLines.length} books | Consensus: ${odds.consensus}
    **Hit Rate**: ${hitRate}% (${overCount}/${stats.length} over ${currentLine})

    **Advanced Metrics**:
    - Season Average: ${avgValue.toFixed(1)} ${propType}
    - L3 Average: ${avgRecent3.toFixed(1)} ${propType}
    - Consistency Score: ${advancedMetrics.consistency}%
    - Trend: ${advancedMetrics.trendDirection}
    - Recent Form: ${advancedMetrics.recentMomentum}
    - Volatility: ${advancedMetrics.volatility}%

    ${matchupInsight ? `**Matchup Context**: ${matchupInsight.interpretation}` : ''}

    **Upcoming**: ${odds.game.awayTeam} @ ${odds.game.homeTeam}

    **Game Log** (Last ${stats.length}):
    ${stats.map(g => `${g.game_date}: ${getStatValue(g, propType)} ${propType.toUpperCase()} vs ${g.opponent} (${g.is_home ? 'Home' : 'Away'})`).join('\n')}
    `
  } else {
    // RESEARCH MODE: No betting lines available
    systemPrompt = `
    You are a Professional NBA Analyst. Provide performance analysis and projections based on recent data.

    RULES:
    1. Analyze trends in the player's recent performance
    2. Note any consistency or volatility
    3. Consider matchup difficulty
    4. Provide a projection for their next game
    5. Keep it concise and data-driven

    Output Format: Markdown. Concise. No fluff.
    `

    userPrompt = `
    Player: ${playerName}
    Prop Type: ${propType.toUpperCase()}
    Last ${stats.length} Games Average: ${avgValue.toFixed(1)} ${propType}
    Last 3 Games: ${recentForm}

    **NOTE**: No betting lines currently available for this player.

    Recent Games:
    ${stats.map(g => `${g.game_date}: ${getStatValue(g, propType)} ${propType.toUpperCase()} vs ${g.opponent} (${g.is_home ? 'Home' : 'Away'})`).join('\n')}
    `
  }

  // H. Generate Analysis (only if OpenAI key is configured)
  let analysis = ''

  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await withTimeout(
        generateText({
          model: openai('gpt-4o'),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.2,
        }).then((result) => result.text),
        OPENAI_TIMEOUT_MS,
        ''
      )
      if (!text) {
        timeoutNotes.push('AI analysis timed out.')
      }
      analysis = text
    } catch (error) {
      console.error('OpenAI error:', error)
      analysis = `**AI Analysis Unavailable**\n\nManual Analysis:\n- Average: ${avgValue.toFixed(1)} ${propType}\n- Last 3 games: ${recentForm}\n- Configure OPENAI_API_KEY for AI insights`
    }
  } else {
    analysis = `**AI Analysis Unavailable**\n\nConfigure OPENAI_API_KEY in .env.local for AI-powered insights.\n\n**Quick Stats:**\n- Average: ${avgValue.toFixed(1)} ${propType}\n- Last 3 games: ${recentForm}`
  }

  if (!analysis.trim()) {
    analysis = `**Research Summary**\n\n- Average: ${avgValue.toFixed(1)} ${propType}\n- Last 3 games: ${recentForm}\n- Source fallback mode was used to avoid long waits.`
  }

  if (timeoutNotes.length > 0) {
    analysis += `\n\n**Timeout Notes**\n- ${timeoutNotes.join('\n- ')}`
  }

  return {
    stats,
    odds,
    analysis,
    playerPhoto,
    propType,
    hasActiveProp: !!odds,
    matchupInsight,
    advancedMetrics,
    riskScore
  }
}
