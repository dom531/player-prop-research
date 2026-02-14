export function PanelSkeleton({ title }: { title: string }) {
  return (
    <section className="glass-card p-6">
      <h2 className="mb-4 text-2xl font-bold text-primary font-mono">{title}</h2>
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
        <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
        <div className="h-10 bg-bg-secondary border border-primary-dim/30" />
      </div>
    </section>
  )
}
