import type { ScheduleItem } from '@/types/homepage'

type SchedulePanelProps = {
  schedule: ScheduleItem[]
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

export default function SchedulePanel({ schedule }: SchedulePanelProps) {
  return (
    <section id="schedule" className="glass-card scroll-mt-28 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary font-mono">Schedule</h2>
        <p className="text-xs text-text-dim">Today</p>
      </div>

      {schedule.length === 0 ? (
        <div className="metric-card text-center text-text-secondary">No NBA games on schedule today.</div>
      ) : (
        <div className="overflow-x-auto border border-primary-dim">
          <table className="w-full min-w-[760px] text-left font-mono text-sm">
            <thead className="bg-bg-secondary text-text-dim uppercase tracking-wider text-xs">
              <tr>
                <th className="px-3 py-3">Away Team</th>
                <th className="px-3 py-3">Home Team</th>
                <th className="px-3 py-3">Tipoff</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((game, index) => (
                <tr key={`${game.awayTeam}-${game.homeTeam}-${index}`} className="border-t border-primary-dim/40">
                  <td className="px-3 py-3 text-text-primary">{game.awayTeam}</td>
                  <td className="px-3 py-3 text-text-primary">{game.homeTeam}</td>
                  <td className="px-3 py-3 text-text-secondary">{formatTipoff(game.tipoffTime)}</td>
                  <td className="px-3 py-3 text-text-secondary">{game.gameStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
