import Link from "next/link"
import {
  ArrowRight,
  Clock,
  CloudUpload,
  Crown,
  Feather,
  Globe,
  Quote,
  Sparkles,
  Users,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"
import { avatarSrc, characterColor } from "@/lib/characters"
import { timeAgo } from "@/lib/time"
import { Avatar } from "@/components/layout/Sidebar"
import { QuoteCard } from "@/components/layout/PageHeader"
import { NoWorlds, WorldCard, loadWorldCards } from "@/components/worlds/WorldCard"

/** Class strings are spelled out in full so Tailwind can find them. */
const ACTIONS = [
  {
    href: "/characters/new",
    title: "Create Character",
    hint: "Bring your ideas to life",
    icon: Feather,
    card: "border-violet-400/30 from-violet-500/20 hover:border-violet-400/70",
    badge: "bg-violet-500/20 text-violet-200 ring-violet-400/40",
  },
  {
    href: "/import",
    title: "Import Telegram",
    hint: "Continue your story",
    icon: CloudUpload,
    card: "border-sky-400/30 from-sky-500/20 hover:border-sky-400/70",
    badge: "bg-sky-500/20 text-sky-200 ring-sky-400/40",
  },
  {
    href: "/worlds/new",
    title: "Create World",
    hint: "Build a new realm",
    icon: Globe,
    card: "border-amber-400/30 from-amber-500/20 hover:border-amber-400/70",
    badge: "bg-amber-500/20 text-amber-200 ring-amber-400/40",
  },
  {
    href: "/worlds/join",
    title: "Join World",
    hint: "Enter a new story",
    icon: Users,
    card: "border-emerald-400/30 from-emerald-500/20 hover:border-emerald-400/70",
    badge: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40",
  },
]

const WORLDS_SHOWN = 3

export default async function DashboardPage() {
  const userId = await requireUserId()

  const [me, worlds, activity] = await Promise.all([
    prisma.character.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { name: true },
    }),
    loadWorldCards(userId),
    prisma.message.findMany({
      where: { deletedAt: null, world: { members: { some: { userId } } } },
      orderBy: { timestamp: "desc" },
      take: 4,
      select: {
        id: true,
        timestamp: true,
        world: { select: { id: true, name: true } },
        character: {
          select: { id: true, name: true, color: true, avatarUrl: true, avatarUpdatedAt: true },
        },
      },
    }),
  ])

  // The most recently active world with a banner sets the scene behind the greeting.
  const heroBanner = worlds.find((w) => w.banner)?.banner

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 md:p-8 lg:p-10">
      <section className="relative overflow-hidden rounded-3xl border border-line">
        {heroBanner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroBanner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,92,255,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-canvas to-transparent" />

        <div className="relative space-y-8 p-5 md:p-10">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="font-display text-2xl text-muted md:text-3xl">Welcome back,</p>
              <h1 className="flex flex-wrap items-center gap-x-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
                {me?.name ?? "storyteller"}
                <Crown size={30} className="text-amber-300" />
              </h1>
              <p className="mt-3 font-display text-lg italic text-muted">
                &ldquo;Every story you write lives somewhere.&rdquo;
              </p>
            </div>
            <QuoteCard>Stories · People · Worlds · Together</QuoteCard>
          </div>

          {/* Four across only on wide screens: monospace titles like "Character"
              are wider than a quarter of a medium-sized hero. */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`group flex flex-col items-center rounded-2xl border bg-gradient-to-b to-surface/80 p-4 text-center backdrop-blur transition hover:-translate-y-0.5 md:p-5 ${a.card}`}
              >
                <span
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-1 md:h-14 md:w-14 ${a.badge}`}
                >
                  <a.icon size={24} />
                </span>
                <span className="font-display text-lg font-semibold leading-tight text-ink md:text-xl">
                  {a.title}
                </span>
                <span className="mt-1 text-[11px] text-muted md:text-xs">{a.hint}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="flex items-center gap-2.5 text-3xl font-semibold text-ink">
            <Sparkles size={18} className="text-accent-soft" /> Your Worlds
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
          {worlds.length > WORLDS_SHOWN && (
            <Link
              href="/worlds"
              className="flex items-center gap-1.5 text-sm font-medium text-accent-soft hover:text-ink"
            >
              View All <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {worlds.length === 0 ? (
          <NoWorlds />
        ) : (
          <div className="space-y-3">
            {worlds.slice(0, WORLDS_SHOWN).map((world) => (
              <WorldCard key={world.id} world={world} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-ink">
            <Clock size={16} className="text-muted" /> Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">Nothing written yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {activity.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.character.name} src={avatarSrc(m.character)} size={32} />
                  <div className="min-w-0 text-sm">
                    <div className="truncate text-ink/90">
                      <span className="font-medium" style={{ color: characterColor(m.character) }}>
                        {m.character.name}
                      </span>{" "}
                      wrote in{" "}
                      <Link
                        href={`/worlds/${m.world.id}`}
                        className="font-medium text-accent-soft hover:text-ink"
                      >
                        {m.world.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted">{timeAgo(m.timestamp)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <figure className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-line bg-surface bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.14),transparent_60%)] p-6">
          <Quote size={28} className="text-accent-soft" />
          <blockquote className="mt-3 font-display text-2xl leading-snug text-ink/90 md:text-3xl">
            A good roleplay is a place you return to.
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted">— RPWeb</figcaption>
        </figure>
      </section>
    </div>
  )
}
