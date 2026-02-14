'use client'

import { TrendingUp } from 'lucide-react'

interface LiveOddsBannerProps {
  odds: {
    bestLine: {
      sportsbook: string
      line: number
      overOdds: number
    }
    allLines: Array<{
      sportsbook: string
      line: number
      overOdds: number
    }>
    game: {
      homeTeam: string
      awayTeam: string
    }
  }
  propType: string
  playerName: string
}

export default function LiveOddsBanner({ odds, propType, playerName }: LiveOddsBannerProps) {
  // Duplicate lines for infinite scroll effect
  const duplicatedLines = [...odds.allLines, ...odds.allLines]

  return (
    <div className="w-full bg-bg-card border-y-2 border-primary-dim overflow-hidden relative">
      {/* Static Header */}
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-bg-card via-bg-card to-transparent px-4 flex items-center">
        <div className="flex items-center gap-2 pr-8">
          <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
            [LIVE_ODDS]
          </span>
        </div>
      </div>

      {/* Scrolling Content - CSS Animation */}
      <div className="flex items-center py-3 pl-32 odds-scroll-container overflow-hidden">
        <div className="flex items-center animate-scroll-left whitespace-nowrap">
          {duplicatedLines.map((line, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-3 px-6 border-r border-primary-dim/30"
            >
              {/* Sportsbook Name */}
              <span className="text-sm font-mono text-text-secondary">
                {line.sportsbook}
              </span>

              {/* Line Value */}
              <span className={`text-lg font-bold font-mono ${
                idx % odds.allLines.length === 0
                  ? 'text-primary'
                  : 'text-text-primary'
              }`}>
                {line.line}
              </span>

              {/* Odds */}
              <span className="text-xs text-text-dim font-mono">
                ({line.overOdds > 0 ? '+' : ''}{line.overOdds})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fade effect on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-card to-transparent pointer-events-none" />
    </div>
  )
}
