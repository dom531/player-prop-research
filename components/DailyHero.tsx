import Link from 'next/link'
import type { HomepagePayload } from '@/types/homepage'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type DailyHeroProps = {
  payload: HomepagePayload
}

export default function DailyHero({ payload }: DailyHeroProps) {
  return (
    <section id="overview" className="glass-card mb-8 scroll-mt-28 p-6">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-mono text-text-dim">[NBA_DAILY_HUB]</p>
          <h1 className="mt-2 text-3xl font-bold text-primary font-mono">Popular Props Today</h1>
          <p className="mt-3 text-text-secondary">
            {formatDate(payload.updatedAt)}
          </p>
          <p className="mt-2 text-sm text-text-dim">
            Trends: {payload.sourceHealth.trends.toUpperCase()} | Injuries: {payload.sourceHealth.injuries.toUpperCase()} | Schedule: {payload.sourceHealth.schedule.toUpperCase()}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/research" className="premium-button inline-flex items-center">
              View Research
            </Link>
            <a href="#trends" className="inline-flex items-center border border-primary-dim px-4 py-2 text-text-secondary hover:border-primary hover:text-primary">
              View Trends
            </a>
          </div>
        </div>

        <div className="metric-card">
          <p className="text-xs text-text-dim">Today Snapshot</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{payload.trends.length}</p>
              <p className="text-xs text-text-dim">Signals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{payload.injuries.length}</p>
              <p className="text-xs text-text-dim">Injuries</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{payload.schedule.length}</p>
              <p className="text-xs text-text-dim">Games</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
