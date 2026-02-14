'use client'

import React from 'react'
import { TrendingUp, TrendingDown, AlertCircle, X } from 'lucide-react'

type PlayerComparisonData = {
  playerName: string
  propType: string
  stats: any[]
  odds: any
  advancedMetrics?: {
    consistency: number
    trendDirection: string
    volatility: number
    recentMomentum: string
  }
  riskScore?: {
    score: number
    level: string
  }
}

interface PlayerComparisonProps {
  players: PlayerComparisonData[]
  onRemovePlayer: (index: number) => void
}

export default function PlayerComparison({ players, onRemovePlayer }: PlayerComparisonProps) {
  if (players.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Players to Compare</h3>
        <p className="text-sm text-slate-500">Add players to start comparing their stats</p>
      </div>
    )
  }

  const metricMap: Record<string, string> = {
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Player Comparison</h2>
        <span className="text-sm text-slate-400">{players.length} player{players.length > 1 ? 's' : ''}</span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player, index) => {
          const targetMetric = metricMap[player.propType] || 'points'
          const avgValue = player.stats.length > 0
            ? player.stats.reduce((sum, g) => sum + (g[targetMetric] || 0), 0) / player.stats.length
            : 0

          const currentLine = player.odds?.bestLine?.line || 0
          const overCount = currentLine > 0
            ? player.stats.filter(g => (g[targetMetric] || 0) > currentLine).length
            : 0
          const hitRate = player.stats.length > 0 ? (overCount / player.stats.length) * 100 : 0

          return (
            <div key={index} className="glass-card p-6 relative">
              {/* Remove Button */}
              <button
                onClick={() => onRemovePlayer(index)}
                className="absolute top-4 right-4 p-1 hover:bg-red-500/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
              </button>

              {/* Player Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{player.playerName}</h3>
                <span className="text-xs uppercase tracking-wider text-emerald-400">
                  {player.propType}
                </span>
              </div>

              {/* Key Stats */}
              <div className="space-y-4">
                {/* Average */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Season Average</div>
                  <div className="text-2xl font-bold mono text-white">{avgValue.toFixed(1)}</div>
                </div>

                {/* Line & Hit Rate */}
                {currentLine > 0 && (
                  <>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Target Line</div>
                      <div className="text-2xl font-bold mono text-emerald-400">{currentLine}</div>
                      {player.odds?.bestLine?.sportsbook && (
                        <div className="text-xs text-slate-500 mt-1">{player.odds.bestLine.sportsbook}</div>
                      )}
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Hit Rate</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold mono text-emerald-400">{hitRate.toFixed(0)}%</span>
                        <span className="text-xs text-slate-500">({overCount}/{player.stats.length})</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Advanced Metrics */}
                {player.advancedMetrics && (
                  <>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Consistency</div>
                      <div className={`text-xl font-bold mono ${
                        player.advancedMetrics.consistency >= 80 ? 'text-emerald-400' :
                        player.advancedMetrics.consistency >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {player.advancedMetrics.consistency}%
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Recent Form</div>
                      <div className="text-sm font-semibold text-white">
                        {player.advancedMetrics.recentMomentum}
                      </div>
                    </div>
                  </>
                )}

                {/* Risk Score */}
                {player.riskScore && (
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2">Risk Level</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      player.riskScore.level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                      player.riskScore.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {player.riskScore.level}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{player.riskScore.score}/100</div>
                  </div>
                )}

                {/* Recent Games Mini View */}
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-2">Last 5 Games</div>
                  <div className="flex gap-1">
                    {player.stats.slice(0, 5).map((game, idx) => {
                      const gameValue = game[targetMetric] || 0
                      const hitLine = currentLine > 0 && gameValue > currentLine
                      return (
                        <div
                          key={idx}
                          className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold ${
                            currentLine > 0
                              ? hitLine
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {gameValue}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Side-by-Side Stats Table */}
      {players.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Head-to-Head Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Metric</th>
                  {players.map((player, idx) => (
                    <th key={idx} className="text-center py-3 px-4 text-white font-semibold">
                      {player.playerName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50">
                  <td className="py-3 px-4 text-slate-300">Average</td>
                  {players.map((player, idx) => {
                    const targetMetric = metricMap[player.propType] || 'points'
                    const avgValue = player.stats.length > 0
                      ? player.stats.reduce((sum, g) => sum + (g[targetMetric] || 0), 0) / player.stats.length
                      : 0
                    return (
                      <td key={idx} className="py-3 px-4 text-center font-mono font-bold text-white">
                        {avgValue.toFixed(1)}
                      </td>
                    )
                  })}
                </tr>

                {players[0].odds && (
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-slate-300">Line</td>
                    {players.map((player, idx) => (
                      <td key={idx} className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        {player.odds?.bestLine?.line || 'N/A'}
                      </td>
                    ))}
                  </tr>
                )}

                {players[0].advancedMetrics && (
                  <>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-slate-300">Consistency</td>
                      {players.map((player, idx) => (
                        <td key={idx} className="py-3 px-4 text-center font-mono font-bold">
                          <span className={
                            (player.advancedMetrics?.consistency || 0) >= 80 ? 'text-emerald-400' :
                            (player.advancedMetrics?.consistency || 0) >= 60 ? 'text-amber-400' : 'text-red-400'
                          }>
                            {player.advancedMetrics?.consistency || 0}%
                          </span>
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-slate-300">Volatility</td>
                      {players.map((player, idx) => (
                        <td key={idx} className="py-3 px-4 text-center font-mono text-slate-300">
                          {player.advancedMetrics?.volatility || 0}%
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {players[0].riskScore && (
                  <tr>
                    <td className="py-3 px-4 text-slate-300">Risk Score</td>
                    {players.map((player, idx) => (
                      <td key={idx} className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          player.riskScore?.level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                          player.riskScore?.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {player.riskScore?.score || 0}
                        </span>
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
