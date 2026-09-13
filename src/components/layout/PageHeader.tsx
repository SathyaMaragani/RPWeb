/** The title block at the top of a workspace page. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  quote,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  quote?: string
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-ink md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-5">
        {action}
        {quote && <QuoteCard>{quote}</QuoteCard>}
      </div>
    </header>
  )
}

/** A small framed epigraph. Decoration only, so it steps aside below wide screens. */
export function QuoteCard({ children }: { children: React.ReactNode }) {
  return (
    <figure className="hidden w-40 shrink-0 rounded-xl border border-line bg-surface/60 px-4 py-3 font-display text-[15px] italic leading-snug text-muted backdrop-blur xl:block">
      &ldquo;{children}&rdquo;
      <div className="mt-2 h-px w-10 bg-line" />
    </figure>
  )
}
