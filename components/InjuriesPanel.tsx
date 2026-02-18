'use client'

import { useMemo, useState } from 'react'
import type { InjuryItem } from '@/types/homepage'

type SortKey = 'playerName' | 'injury' | 'status' | 'team'

type InjuriesPanelProps = {
  injuries: InjuryItem[]
}

export default function InjuriesPanel({ injuries }: InjuriesPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [ascending, setAscending] = useState(true)
  const [teamFilter, setTeamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const teams = useMemo(() => {
    const values = Array.from(new Set(injuries.map((item) => item.team))).sort()
    return ['all', ...values]
  }, [injuries])

  const normalizeStatusBucket = (status: string) => {
    const value = status.toLowerCase()
    if (value.includes('out')) return 'out'
    if (value.includes('doubt')) return 'doubtful'
    if (value.includes('question')) return 'questionable'
    if (value.includes('probable')) return 'probable'
    if (value.includes('day')) return 'day-to-day'
    return 'other'
  }

  const sorted = useMemo(() => {
    const filtered = injuries.filter((item) => {
      const teamMatch = teamFilter === 'all' || item.team === teamFilter
      const statusMatch =
        statusFilter === 'all' || normalizeStatusBucket(item.status) === statusFilter
      const query = searchQuery.trim().toLowerCase()
      const searchMatch =
        query.length === 0 ||
        item.playerName.toLowerCase().includes(query) ||
        item.injury.toLowerCase().includes(query)
      return teamMatch && statusMatch && searchMatch
    })

    return [...filtered].sort((a, b) => {
      const left = String(a[sortKey]).toLowerCase()
      const right = String(b[sortKey]).toLowerCase()
      if (left === right) return 0
      if (ascending) return left > right ? 1 : -1
      return left < right ? 1 : -1
    })
  }, [injuries, sortKey, ascending, teamFilter, statusFilter, searchQuery])

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setAscending((prev) => !prev)
      return
    }
    setSortKey(key)
    setAscending(true)
  }

  return (
    <section id="injuries" className="glass-card scroll-mt-28 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary font-mono">Injuries</h2>
        <p className="text-xs text-text-dim">NBA</p>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="out">Out</option>
          <option value="doubtful">Doubtful</option>
          <option value="questionable">Questionable</option>
          <option value="probable">Probable</option>
          <option value="day-to-day">Day-to-day</option>
          <option value="other">Other</option>
        </select>
        <input
          className="glass-input px-3 py-2 md:flex-1"
          type="text"
          placeholder="Search player or injury..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <p className="mb-3 text-xs text-text-dim">
        Showing {sorted.length} of {injuries.length}
      </p>

      {sorted.length === 0 ? (
        <div className="metric-card text-center text-text-secondary">
          No NBA injuries available right now.
        </div>
      ) : (
        <div className="overflow-x-auto border border-primary-dim">
          <table className="w-full min-w-[860px] text-left font-mono text-sm">
            <thead className="bg-bg-secondary text-text-dim uppercase tracking-wider text-xs">
              <tr>
                <th className="px-3 py-3">
                  <button onClick={() => onSort('playerName')} className="hover:text-primary">Player</button>
                </th>
                <th className="px-3 py-3">
                  <button onClick={() => onSort('injury')} className="hover:text-primary">Injury</button>
                </th>
                <th className="px-3 py-3">
                  <button onClick={() => onSort('status')} className="hover:text-primary">Status</button>
                </th>
                <th className="px-3 py-3">
                  <button onClick={() => onSort('team')} className="hover:text-primary">Team</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={`${item.playerName}-${item.team}-${index}`} className="border-t border-primary-dim/40">
                  <td className="px-3 py-3 text-text-primary">{item.playerName}</td>
                  <td className="px-3 py-3 text-text-secondary">{item.injury}</td>
                  <td className="px-3 py-3 text-text-secondary uppercase">{item.status}</td>
                  <td className="px-3 py-3 text-text-secondary">{item.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
