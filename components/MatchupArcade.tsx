'use client'

import { useMemo, useState } from 'react'
import type { HomepageArcadeGame } from '@/types/homepage'
import CoachRoomPanel from './CoachRoomPanel'

type MatchupArcadeProps = {
  arcadeGames: HomepageArcadeGame[]
}

function formatTipoff(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'TBD'
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export default function MatchupArcade({ arcadeGames }: MatchupArcadeProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(
    arcadeGames[0]?.gameId || null
  )

  const selectedGame = useMemo(
    () => arcadeGames.find((game) => game.gameId === selectedGameId) || arcadeGames[0] || null,
    [arcadeGames, selectedGameId]
  )

  return (
    <section id="arcade" className="glass-card scroll-mt-28 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary font-mono">Matchup Arcade</h2>
        <p className="text-xs text-text-dim">Interactive</p>
      </div>

      {arcadeGames.length === 0 ? (
        <div className="metric-card text-center text-text-secondary">
          No NBA matchups available right now.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {arcadeGames.map((game) => (
              <button
                key={game.gameId}
                onClick={() => setSelectedGameId(game.gameId)}
                className={`w-full border p-4 text-left transition-all ${
                  selectedGame?.gameId === game.gameId
                    ? 'border-primary bg-bg-secondary'
                    : 'border-primary-dim hover:border-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-text-primary font-mono">
                    {game.awayTeam} @ {game.homeTeam}
                  </p>
                  <p className="text-xs text-text-dim">{formatTipoff(game.tipoffTime)}</p>
                </div>
                <p className="mt-1 text-xs text-text-dim">{game.gameStatus}</p>

                {game.topProps.length === 0 ? (
                  <p className="mt-3 text-xs text-text-secondary">No props for this game yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {game.topProps.map((prop) => (
                      <div key={`${prop.playerName}-${prop.propType}`} className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">
                          {prop.playerName} {prop.propType.toUpperCase()} {prop.line}
                        </span>
                        <span className="text-primary font-mono">{prop.edgeScore.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <CoachRoomPanel game={selectedGame} />
        </div>
      )}
    </section>
  )
}
