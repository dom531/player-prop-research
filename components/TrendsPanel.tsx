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
  const [riskFilter, setRiskFilter] = useState('all')
  const [minSampleFilter, setMinSampleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('edgeScore')

  const getConfidence = (trend: HomepageTrendItem): 'High' | 'Medium' | 'Low' => {
    if (trend.sampleSize >= 8 && trend.volatility < 35) return 'High'
    if (trend.sampleSize >= 5 && trend.volatility < 55) return 'Medium'
    return 'Low'
  }

  const teams = useMemo(() => {
    const unique = Array.from(new Set(trends.map((trend) => trend.team))).sort()
    return ['all', ...unique]
  }, [trends])

  const filtered = useMemo(() => {
    const items = trends.filter((trend) => {
      const teamMatch = teamFilter === 'all' || trend.team === teamFilter
      const propMatch = propFilter === 'all' || trend.propType === propFilter
      const riskMatch =
        riskFilter === 'all' || trend.riskLevel.toLowerCase() === riskFilter
      const sampleThreshold = minSampleFilter === 'all' ? 0 : Number(minSampleFilter)
      const sampleMatch = trend.sampleSize >= sampleThreshold
      return teamMatch && propMatch && riskMatch && sampleMatch
    })

    return [...items].sort((a, b) => {
      if (sortBy === 'edgeScore') return b.edgeScore - a.edgeScore
      if (sortBy === 'hitRate') return b.hitRate - a.hitRate
      if (sortBy === 'line') return a.line - b.line
      if (sortBy === 'player') return a.playerName.localeCompare(b.playerName)
      return 0
    })
  }, [trends, teamFilter, propFilter, riskFilter, minSampleFilter, sortBy])

  return (
    <section id="trends" className="glass-card scroll-mt-28 p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-primary font-mono">Popular Props Today</h2>
        <div className="flex flex-wrap gap-2">
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
          <select
            className="glass-input px-3 py-2"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
          <select
            className="glass-input px-3 py-2"
            value={minSampleFilter}
            onChange={(e) => setMinSampleFilter(e.target.value)}
          >
            <option value="all">All Samples</option>
            <option value="5">5+ Games</option>
            <option value="8">8+ Games</option>
            <option value="10">10+ Games</option>
          </select>
          <select
            className="glass-input px-3 py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="edgeScore">Sort: Edge Score</option>
            <option value="hitRate">Sort: Hit Rate</option>
            <option value="line">Sort: Line</option>
            <option value="player">Sort: Player</option>
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
                <th className="px-3 py-3">Confidence</th>
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
                  <td className="px-3 py-3">
                    <span
                      className={`stat-badge ${
                        getConfidence(trend) === 'High'
                          ? 'success'
                          : getConfidence(trend) === 'Medium'
                            ? 'warning'
                            : 'danger'
                      }`}
                    >
                      {getConfidence(trend)}
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
