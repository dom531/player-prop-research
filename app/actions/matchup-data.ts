'use server'

import { findPlayerId } from './nba-stats'
const MATCHUP_FETCH_TIMEOUT_MS = 2500

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

export type MatchupInsight = {
  opponentRank: number | null
  defenseVsPosRank: number | null
  pace: number | null
  interpretation: string
}

export async function getMatchupData(
  playerName: string,
  opponent: string,
  propType: string
): Promise<MatchupInsight> {
  try {
    const playerId = await findPlayerId(playerName)
    if (!playerId) {
      return {
        opponentRank: null,
        defenseVsPosRank: null,
        pace: null,
        interpretation: 'Player ID not found'
      }
    }

    const [opponentRank, defenseVsPosRank, pace] = await Promise.all([
      fetchOpponentDefensiveRank(opponent, propType),
      fetchDefenseVsPosition(opponent, propType),
      fetchTeamPace(opponent),
    ])

    // Generate interpretation
    const interpretation = generateMatchupInterpretation(
      opponentRank,
      defenseVsPosRank,
      pace,
      propType
    )

    return {
      opponentRank,
      defenseVsPosRank,
      pace,
      interpretation
    }
  } catch (error) {
    console.error('Matchup data error:', error)
    return {
      opponentRank: null,
      defenseVsPosRank: null,
      pace: null,
      interpretation: 'Unable to fetch matchup data'
    }
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com'
      },
      next: { revalidate: 3600 },
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchOpponentDefensiveRank(
  team: string,
  propType: string
): Promise<number | null> {
  try {
    const statMap: Record<string, string> = {
      points: 'DefRating',
      rebounds: 'DREB',
      assists: 'OPP_AST'
    }

    const stat = statMap[propType] || 'DefRating'

    // Using NBA Stats API to get team defensive stats
    const response = await fetchWithTimeout(
      `https://stats.nba.com/stats/leaguedashteamstats?Conference=&DateFrom=&DateTo=&Division=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&Location=&MeasureType=Defense&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${getCurrentSeason()}&SeasonSegment=&SeasonType=Regular%20Season&ShotClockRange=&StarterBench=&TeamID=0&TwoWay=0&VsConference=&VsDivision=`,
      MATCHUP_FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      console.warn('NBA Stats API request failed')
      return null
    }

    const data = await response.json()
    const teams = data.resultSets[0].rowSet

    // Find team rank (lower is better defense)
    const teamIndex = teams.findIndex((t: any) =>
      t[1]?.toLowerCase().includes(team.toLowerCase().split(' ').pop() || '')
    )

    return teamIndex >= 0 ? teamIndex + 1 : null
  } catch (error) {
    console.error('Error fetching defensive rank:', error)
    return null
  }
}

async function fetchDefenseVsPosition(
  team: string,
  propType: string
): Promise<number | null> {
  try {
    // Map prop types to defensive stats
    const statMap: Record<string, string> = {
      points: 'OPP_PTS',     // Opponent points allowed
      rebounds: 'OPP_REB',   // Opponent rebounds allowed
      assists: 'OPP_AST'     // Opponent assists allowed
    }

    const targetStat = statMap[propType] || 'OPP_PTS'

    const response = await fetchWithTimeout(
      `https://stats.nba.com/stats/leaguedashteamstats?Conference=&DateFrom=&DateTo=&Division=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&Location=&MeasureType=Opponent&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${getCurrentSeason()}&SeasonSegment=&SeasonType=Regular%20Season&ShotClockRange=&StarterBench=&TeamID=0&TwoWay=0&VsConference=&VsDivision=`,
      MATCHUP_FETCH_TIMEOUT_MS
    )

    if (!response.ok) return null

    const data = await response.json()
    const teams = data.resultSets[0].rowSet
    const headers = data.resultSets[0].headers

    // Find stat column index
    const statIndex = headers.indexOf(targetStat)
    if (statIndex === -1) return null

    // Create array of [team, stat value] sorted by stat (higher = worse defense)
    const rankedTeams = teams
      .map((t: any[]) => ({
        team: t[1], // Team abbreviation
        value: t[statIndex]
      }))
      .sort((a: { team: string; value: number }, b: { team: string; value: number }) => b.value - a.value) // Descending (more allowed = worse defense)

    // Find team rank (1 = worst defense, 30 = best defense)
    const teamIndex = rankedTeams.findIndex((t: any) =>
      t.team?.toLowerCase().includes(team.toLowerCase().split(' ').pop() || '')
    )

    return teamIndex >= 0 ? teamIndex + 1 : null
  } catch (error) {
    console.error('Error fetching defense vs position:', error)
    return null
  }
}

async function fetchTeamPace(team: string): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(
      `https://stats.nba.com/stats/leaguedashteamstats?Conference=&DateFrom=&DateTo=&Division=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&Location=&MeasureType=Advanced&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${getCurrentSeason()}&SeasonSegment=&SeasonType=Regular%20Season&ShotClockRange=&StarterBench=&TeamID=0&TwoWay=0&VsConference=&VsDivision=`,
      MATCHUP_FETCH_TIMEOUT_MS
    )

    if (!response.ok) return null

    const data = await response.json()
    const teams = data.resultSets[0].rowSet
    const headers = data.resultSets[0].headers

    const paceIndex = headers.indexOf('PACE')
    const teamRow = teams.find((t: any) =>
      t[1]?.toLowerCase().includes(team.toLowerCase().split(' ').pop() || '')
    )

    return teamRow && paceIndex >= 0 ? teamRow[paceIndex] : null
  } catch (error) {
    console.error('Error fetching pace:', error)
    return null
  }
}

function generateMatchupInterpretation(
  opponentRank: number | null,
  defenseVsPosRank: number | null,
  pace: number | null,
  propType: string
): string {
  const insights: string[] = []

  if (opponentRank !== null) {
    if (opponentRank <= 10) {
      insights.push(`Elite defense (#${opponentRank})`)
    } else if (opponentRank >= 20) {
      insights.push(`Weak defense (#${opponentRank})`)
    } else {
      insights.push(`Average defense (#${opponentRank})`)
    }
  }

  // Add position-specific defense insight
  if (defenseVsPosRank !== null) {
    if (defenseVsPosRank <= 10) {
      insights.push(`Lock down ${propType} defense (#${defenseVsPosRank})`)
    } else if (defenseVsPosRank >= 20) {
      insights.push(`Vulnerable to ${propType} (#${defenseVsPosRank})`)
    }
  }

  if (pace !== null) {
    if (pace >= 102) {
      insights.push(`Fast pace (${pace.toFixed(1)})`)
    } else if (pace <= 96) {
      insights.push(`Slow pace (${pace.toFixed(1)})`)
    }
  }

  return insights.length > 0
    ? insights.join(' | ')
    : 'Standard matchup conditions'
}
