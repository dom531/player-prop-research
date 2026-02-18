'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { HomepageArcadeGame, HomepageArcadeProp } from '@/types/homepage'

type CoachRoomPanelProps = {
  game: HomepageArcadeGame | null
}

function toPropLabel(propType: HomepageArcadeProp['propType']) {
  return propType.toUpperCase()
}

function confidenceFor(prop: HomepageArcadeProp): 'High' | 'Medium' | 'Low' {
  if (prop.sampleSize >= 8 && prop.volatility < 35) return 'High'
  if (prop.sampleSize >= 5 && prop.volatility < 55) return 'Medium'
  return 'Low'
}

export default function CoachRoomPanel({ game }: CoachRoomPanelProps) {
  const [factors, setFactors] = useState({
    recentForm: true,
    hitRate: true,
    matchup: true,
    volatilityPenalty: true,
    sampleSizePenalty: true,
  })

  const rankedProps = useMemo(() => {
    if (!game) return []

    return game.allProps
      .map((prop) => {
        let score = prop.edgeScore

        if (factors.recentForm) {
          score += prop.hitRate >= 60 ? 8 : -4
        }
        if (factors.hitRate) {
          score += (10 * (prop.hitRate - 50)) / 50
        }
        if (factors.matchup) {
          score += game.proxyFlags.hasStrongHitRate ? 6 : 0
        }
        if (factors.volatilityPenalty && prop.volatility >= 55) {
          score -= 8
        }
        if (factors.sampleSizePenalty && prop.sampleSize < 8) {
          score -= 6
        }

        return {
          ...prop,
          coachScore: Number(Math.max(0, Math.min(100, score)).toFixed(1)),
        }
      })
      .sort((a, b) => b.coachScore - a.coachScore)
  }, [factors, game])

  if (!game) {
    return (
      <section className="glass-card p-6">
        <h3 className="text-xl font-bold text-primary font-mono">Coach&apos;s Room</h3>
        <p className="mt-4 text-text-secondary">Select a matchup tile to tune factors and rank props.</p>
      </section>
    )
  }

  return (
    <section id="coach-room" className="glass-card p-6">
      <h3 className="text-xl font-bold text-primary font-mono">Coach&apos;s Room</h3>
      <p className="mt-2 text-xs text-text-dim">
        {game.awayTeam} @ {game.homeTeam}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
        {Object.entries(factors).map(([key, value]) => (
          <button
            key={key}
            className={`border px-2 py-2 text-left ${
              value
                ? 'border-primary text-primary'
                : 'border-primary-dim text-text-dim'
            }`}
            onClick={() => setFactors((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {rankedProps.length === 0 ? (
          <div className="metric-card text-center text-text-secondary">
            No props for this matchup yet.
          </div>
        ) : (
          rankedProps.map((prop) => (
            <div key={`${prop.playerName}-${prop.propType}`} className="metric-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-text-primary font-mono">{prop.playerName}</p>
                  <p className="text-xs text-text-dim">
                    {toPropLabel(prop.propType)} {prop.line} @ {prop.bestBook}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-mono">{prop.coachScore}</p>
                  <p className="text-xs text-text-dim">{confidenceFor(prop)} confidence</p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={`/research?player=${encodeURIComponent(prop.playerName)}&prop=${prop.propType}`}
                  className="inline-flex border border-primary-dim px-3 py-1 text-xs font-mono text-text-secondary hover:border-primary hover:text-primary"
                >
                  View Research
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
