'use client'

import { useMemo, useState } from 'react'
import type { HomepageTrendItem } from '@/types/homepage'

type TrendsPanelProps = {
  trends: HomepageTrendItem[]
}

const propOptions = [
  { value: 'all', label: 'All Props' },
  { value: 'points', label: 'Points' },
  { value: 'rebounds', label: 'Rebounds' },
  { value: 'assists', label: 'Assists' },
]

export default function TrendsPanel({ trends }: TrendsPanelProps) {
  const [teamFilter, setTeamFilter] = useState('all')
  const [propFilter, setPropFilter] = useState('all')

  const teams = useMemo(() => {
    const unique = Array.from(new Set(trends.map((trend) => trend.team))).sort()
    return ['all', ...unique]
  }, [trends])

  const filtered = useMemo(() => {
    return trends.filter((trend) => {
      const teamMatch = teamFilter === 'all' || trend.team === teamFilter
      const propMatch = propFilter === 'all' || trend.propType === propFilter
      return teamMatch && propMatch
    })
  }, [trends, teamFilter, propFilter])

  return (
    <section id="trends" className="glass-card scroll-mt-28 p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-primary font-mono">Popular Props Today</h2>
        <div className="flex gap-2">
          <select
            className="glass-input px-3 py-2"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team === 'all' ? 'All Teams' : team}
              </option>
            ))}
          </select>
          <select
            className="glass-input px-3 py-2"
            value={propFilter}
            onChange={(e) => setPropFilter(e.target.value)}
          >
            {propOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="metric-card text-center text-text-secondary">
          No trends available right now. We will surface top signals once data refresh completes.
        </div>
      ) : (
        <div className="overflow-x-auto border border-primary-dim">
          <table className="w-full min-w-[860px] text-left font-mono text-sm">
            <thead className="bg-bg-secondary text-text-dim uppercase tracking-wider text-xs">
              <tr>
                <th className="px-3 py-3">Player</th>
                <th className="px-3 py-3">Team</th>
                <th className="px-3 py-3">Prop</th>
                <th className="px-3 py-3">Line</th>
                <th className="px-3 py-3">Book</th>
                <th className="px-3 py-3">Hit Rate</th>
                <th className="px-3 py-3">Edge Score</th>
                <th className="px-3 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trend) => (
                <tr key={`${trend.playerName}-${trend.propType}`} className="border-t border-primary-dim/40">
                  <td className="px-3 py-3 text-text-primary">{trend.playerName}</td>
                  <td className="px-3 py-3 text-text-secondary">{trend.team}</td>
                  <td className="px-3 py-3 text-text-secondary uppercase">{trend.propType}</td>
                  <td className="px-3 py-3 text-primary">{trend.line}</td>
                  <td className="px-3 py-3 text-text-secondary">{trend.bestBook}</td>
                  <td className="px-3 py-3 text-text-secondary">{trend.hitRate.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-primary">{trend.edgeScore.toFixed(1)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`stat-badge ${
                        trend.riskLevel === 'Low'
                          ? 'success'
                          : trend.riskLevel === 'Medium'
                            ? 'warning'
                            : 'danger'
                      }`}
                    >
                      {trend.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
