import HomepageNav from '@/components/HomepageNav'
import DailyHero from '@/components/DailyHero'
import TrendsPanel from '@/components/TrendsPanel'
import InjuriesPanel from '@/components/InjuriesPanel'
import SchedulePanel from '@/components/SchedulePanel'
import { getHomepageData } from './actions/homepage'

export const revalidate = 900

export default async function HomePage() {
  const payload = await getHomepageData()

  return (
    <main className="min-h-screen pb-10">
      <HomepageNav />
      <div className="container mx-auto max-w-6xl px-6 pt-8 space-y-8">
        <section className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <a href="#overview" className="stat-badge success">Overview</a>
            <a href="#trends" className="stat-badge">Trends ({payload.trends.length})</a>
            <a href="#injuries" className="stat-badge warning">Injuries ({payload.injuries.length})</a>
            <a href="#schedule" className="stat-badge">Schedule ({payload.schedule.length})</a>
          </div>
        </section>
        <DailyHero payload={payload} />
        <TrendsPanel trends={payload.trends} />
        <InjuriesPanel injuries={payload.injuries} />
        <SchedulePanel schedule={payload.schedule} />
      </div>
    </main>
  )
}
