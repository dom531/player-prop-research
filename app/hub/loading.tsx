import HomepageNav from '@/components/HomepageNav'
import { PanelSkeleton } from '@/components/SectionSkeletons'

export default function HubLoading() {
  return (
    <main className="min-h-screen pb-10">
      <HomepageNav />
      <div className="container mx-auto max-w-6xl px-6 pt-8 space-y-8">
        <section className="glass-card p-6 animate-pulse">
          <div className="h-6 w-40 bg-bg-secondary border border-primary-dim/30" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="h-16 bg-bg-secondary border border-primary-dim/30" />
            <div className="h-16 bg-bg-secondary border border-primary-dim/30" />
            <div className="h-16 bg-bg-secondary border border-primary-dim/30" />
          </div>
        </section>

        <PanelSkeleton title="Matchup Arcade" />
        <PanelSkeleton title="Injuries" />
        <PanelSkeleton title="Schedule" />
      </div>
    </main>
  )
}
