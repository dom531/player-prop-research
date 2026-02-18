import HomepageNav from '@/components/HomepageNav'

export default function Loading() {
  return (
    <main className="min-h-screen">
      <HomepageNav />
      <div className="container mx-auto max-w-6xl p-6 md:p-12">
        <div className="glass-card p-6 animate-pulse">
          <div className="h-6 w-56 bg-bg-secondary border border-primary-dim/30" />
          <div className="mt-4 space-y-3">
            <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
            <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
            <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
          </div>
        </div>
      </div>
    </main>
  )
}
