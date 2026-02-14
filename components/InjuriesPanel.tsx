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

  const sorted = useMemo(() => {
    return [...injuries].sort((a, b) => {
      const left = String(a[sortKey]).toLowerCase()
      const right = String(b[sortKey]).toLowerCase()
      if (left === right) return 0
      if (ascending) return left > right ? 1 : -1
      return left < right ? 1 : -1
    })
  }, [injuries, sortKey, ascending])

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
