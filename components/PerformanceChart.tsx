'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'

interface PerformanceChartProps {
  stats: any[]
  propType: string
  currentLine?: number
}

export default function PerformanceChart({ stats, propType, currentLine }: PerformanceChartProps) {
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

  const metricMap: Record<string, string> = {
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists'
  }
  const targetMetric = metricMap[propType] || 'points'

  // Get values from stats (reverse to show chronologically)
  const values = [...stats].reverse().map(g => getStatValue(g, propType))
  const dates = [...stats].reverse().map(g => g.game_date)

  if (values.length === 0) return null

  const maxValue = Math.max(...values, currentLine || 0)
  const minValue = Math.min(...values, currentLine || 0)
  const range = maxValue - minValue || 1

  // Calculate average
  const average = values.reduce((a, b) => a + b, 0) / values.length

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Performance Trend
          </h3>
          <p className="text-xs text-slate-500 mt-1">Last {values.length} games</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Average</div>
            <div className="text-lg font-bold mono text-emerald-400">{average.toFixed(1)}</div>
          </div>
          {currentLine && (
            <div className="text-right">
              <div className="text-xs text-slate-400">Line</div>
              <div className="text-lg font-bold mono text-blue-400">{currentLine}</div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 bg-slate-900/50 rounded-lg p-4">
        {/* Grid Lines */}
        <div className="absolute inset-4 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-slate-700/30" />
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-slate-500 font-mono">
          {[maxValue, maxValue - range * 0.25, maxValue - range * 0.5, maxValue - range * 0.75, minValue].map((val, i) => (
            <div key={i} className="pr-2">{val.toFixed(0)}</div>
          ))}
        </div>

        {/* Line Reference (if exists) */}
        {currentLine && (
          <div
            className="absolute left-12 right-4 border-t-2 border-dashed border-blue-400/50"
            style={{
              top: `${16 + ((maxValue - currentLine) / range) * (256 - 32)}px`
            }}
          >
            <span className="absolute -top-3 right-0 text-xs text-blue-400 bg-slate-900 px-1">
              Line
            </span>
          </div>
        )}

        {/* Average Line */}
        <div
          className="absolute left-12 right-4 border-t border-dashed border-emerald-400/50"
          style={{
            top: `${16 + ((maxValue - average) / range) * (256 - 32)}px`
          }}
        >
          <span className="absolute -top-3 left-0 text-xs text-emerald-400 bg-slate-900 px-1">
            Avg
          </span>
        </div>

        {/* Chart Line & Points */}
        <svg className="absolute left-12 right-4 top-4 bottom-4 w-auto h-auto overflow-visible">
          {/* Line Path */}
          <polyline
            fill="none"
            stroke="rgba(16, 185, 129, 0.6)"
            strokeWidth="2"
            points={values.map((val, idx) => {
              const x = (idx / (values.length - 1)) * 100
              const y = ((maxValue - val) / range) * 100
              return `${x}%,${y}%`
            }).join(' ')}
          />

          {/* Data Points */}
          {values.map((val, idx) => {
            const x = (idx / (values.length - 1)) * 100
            const y = ((maxValue - val) / range) * 100
            const hitLine = currentLine ? val > currentLine : false

            return (
              <g key={idx}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="5"
                  className={`${
                    currentLine
                      ? hitLine
                        ? 'fill-emerald-400'
                        : 'fill-red-400'
                      : 'fill-emerald-400'
                  } stroke-slate-900 stroke-2 cursor-pointer hover:r-7 transition-all`}
                />
                {/* Tooltip on hover */}
                <title>{`${dates[idx]}: ${val} ${propType}`}</title>
              </g>
            )
          })}
        </svg>

        {/* X-axis labels (showing every other date for readability) */}
        <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-slate-500 font-mono">
          {dates.map((date, idx) => {
            if (idx % 2 !== 0 && idx !== dates.length - 1) return null
            return (
              <div key={idx} className="rotate-45 origin-left whitespace-nowrap">
                {date.split('-').slice(1).join('/')}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Hit Line</span>
        </div>
        {currentLine && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-slate-400">Miss Line</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-emerald-400/50 border-t border-dashed" />
          <span className="text-slate-400">Average</span>
        </div>
        {currentLine && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-400/50 border-t-2 border-dashed" />
            <span className="text-slate-400">Target Line</span>
          </div>
        )}
      </div>
    </div>
  )
}
