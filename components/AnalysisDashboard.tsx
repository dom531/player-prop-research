'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { TrendingUp, TrendingDown, Home, Plane, AlertCircle, DollarSign } from 'lucide-react'
import PerformanceChart from './PerformanceChart'
import ExportButton from './ExportButton'
import LiveOddsBanner from './LiveOddsBanner'

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

interface DashboardProps {
  data: {
    stats: any[]
    odds: OddsData
    analysis: string
    playerPhoto: string
    propType: string
    hasActiveProp: boolean
    matchupInsight?: {
      opponentRank: number | null
      defenseVsPosRank: number | null
      pace: number | null
      interpretation: string
    }
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
  playerName: string
}

export default function AnalysisDashboard({ data, playerName }: DashboardProps) {
  const { stats, odds, analysis, playerPhoto, propType, hasActiveProp, matchupInsight, advancedMetrics, riskScore } = data

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

  // Determine metric based on prop type
  const metricMap: Record<string, string> = {
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists'
  }
  const targetMetric = metricMap[propType] || 'points'

  // Calculate stats - use DraftKings line specifically
  const draftkingsLine = odds?.allLines?.find(l =>
    l.sportsbook === 'DraftKings' ||
    l.sportsbook === 'draftkings' ||
    l.sportsbook.toLowerCase().includes('draftkings')
  )
  const currentLine = draftkingsLine?.line || odds?.bestLine?.line || 0
  const overCount = currentLine > 0 ? stats.filter(g => getStatValue(g, propType) > currentLine).length : 0
  const hitRate = stats.length > 0 ? (overCount / stats.length) * 100 : 0
  const avgValue = stats.length > 0 ? stats.reduce((sum, g) => sum + getStatValue(g, propType), 0) / stats.length : 0

  return (
    <div className="w-full space-y-6">

      {/* Terminal-style Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-dim">
        <div>
          <p className="text-xs text-text-dim mb-1 font-mono">[PLAYER_ANALYSIS]</p>
          <h1 className="text-2xl font-bold text-primary uppercase tracking-wider font-mono">
            {playerName}
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            PROP_TYPE: {propType.toUpperCase()} | STATUS: {hasActiveProp ? 'LIVE_ODDS' : 'RESEARCH_MODE'}
          </p>
        </div>
        <ExportButton data={data} playerName={playerName} />
      </div>

      {/* Live Odds Motion Banner */}
      {hasActiveProp && odds && (
        <div className="mb-6 -mx-6">
          <LiveOddsBanner
            odds={odds}
            propType={propType}
            playerName={playerName}
          />
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card relative overflow-hidden">
          <div className="flex items-center gap-3">
            <img
              src={playerPhoto}
              alt={playerName}
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/64?text=' + playerName.charAt(0)
              }}
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Player</div>
              <div className="text-lg font-bold">{playerName}</div>
              <div className="text-xs text-emerald-400">{propType.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className={`metric-card ${!hasActiveProp ? 'opacity-50' : ''}`}>
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Target Line</div>
          <div className="text-3xl font-bold mono text-emerald-400">
            {hasActiveProp && odds ? currentLine : 'N/A'}
          </div>
          {hasActiveProp && odds && (
            <div className="text-xs text-slate-500 mt-1">
              {draftkingsLine ? 'DraftKings' : odds.bestLine.sportsbook}
            </div>
          )}
        </div>

        <div className={`metric-card ${!hasActiveProp ? 'opacity-50' : ''}`}>
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Hit Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold mono text-emerald-400">
              {hasActiveProp && currentLine > 0 ? hitRate.toFixed(0) : '-'}%
            </span>
            {hasActiveProp && currentLine > 0 && (
              <span className="text-sm text-slate-400">({overCount}/{stats.length})</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Average {propType}</div>
          <div className="text-3xl font-bold mono">{avgValue.toFixed(1)}</div>
        </div>
      </div>

      {/* Advanced Metrics Section */}
      {advancedMetrics && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Advanced Analytics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Consistency Score</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold mono ${advancedMetrics.consistency >= 80 ? 'text-emerald-400' : advancedMetrics.consistency >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {advancedMetrics.consistency}%
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {advancedMetrics.consistency >= 80 ? 'High reliability' : advancedMetrics.consistency >= 60 ? 'Moderate variance' : 'High volatility'}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Trend Direction</div>
              <div className="text-lg font-semibold text-slate-200">{advancedMetrics.trendDirection}</div>
              <div className="text-xs text-slate-500 mt-1">Recent vs Previous</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Recent Form</div>
              <div className="text-lg font-semibold text-slate-200">{advancedMetrics.recentMomentum}</div>
              <div className="text-xs text-slate-500 mt-1">Last 3 vs Average</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Volatility</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold mono ${advancedMetrics.volatility <= 20 ? 'text-emerald-400' : advancedMetrics.volatility <= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {advancedMetrics.volatility}%
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Standard deviation</div>
            </div>
          </div>

          {matchupInsight && matchupInsight.interpretation && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Matchup Context</span>
              </div>
              <p className="text-sm text-slate-300">{matchupInsight.interpretation}</p>
            </div>
          )}

          {riskScore && (
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  riskScore.level === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  riskScore.level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {riskScore.level} Risk
                </span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Risk Score</span>
                  <span className="text-xs font-mono text-slate-300">{riskScore.score}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      riskScore.level === 'Low' ? 'bg-emerald-500' :
                      riskScore.level === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${riskScore.score}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                {riskScore.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Chart */}
      <PerformanceChart
        stats={stats}
        propType={propType}
        currentLine={currentLine > 0 ? currentLine : undefined}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Recent Games + Line Shopping */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Games */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Recent Performance
            </h3>
            <div className="space-y-2">
              {stats.map((game, idx) => {
                const gameValue = getStatValue(game, propType)
                const hitLine = currentLine > 0 && gameValue > currentLine
                const diff = currentLine > 0 ? gameValue - currentLine : 0
                return (
                  <div
                    key={idx}
                    className={`game-row ${hitLine ? 'hit' : currentLine > 0 ? 'miss' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="mono text-sm font-semibold">{game.opponent}</span>
                        {game.is_home ? (
                          <Home className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Plane className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold mono ${currentLine > 0 ? (hitLine ? 'text-emerald-400' : 'text-red-400') : 'text-slate-300'}`}>
                          {gameValue}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{game.game_date}</span>
                      {currentLine > 0 && (
                        <div className="flex items-center gap-1">
                          {hitLine ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">+{diff.toFixed(1)}</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-red-400" />
                              <span className="text-red-400 font-semibold">{diff.toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Column 2: AI Analysis */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            {hasActiveProp ? 'AI Betting Analysis' : 'AI Research Analysis'}
          </h3>
          <div className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h2: ({children}) => (
                  <h2 className="text-xl font-bold mt-6 mb-3 text-white">
                    {children}
                  </h2>
                ),
                h3: ({children}) => (
                  <h3 className="text-base font-semibold mt-4 mb-2 text-emerald-400">
                    {children}
                  </h3>
                ),
                strong: ({children}) => {
                  const text = String(children)
                  if (text.includes('OVER')) {
                    return <span className="stat-badge success">{children}</span>
                  }
                  if (text.includes('UNDER')) {
                    return <span className="stat-badge danger">{children}</span>
                  }
                  return <strong className="font-semibold text-emerald-400">{children}</strong>
                },
                ul: ({children}) => (
                  <ul className="space-y-2 my-4 text-slate-300">{children}</ul>
                ),
                li: ({children}) => (
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-1">→</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                p: ({children}) => (
                  <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>
                ),
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
