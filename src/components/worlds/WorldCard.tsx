import Link from "next/link"
import { ArrowRight, Globe, MessageSquare, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { bannerSrc } from "@/lib/characters"
import { isWithin, timeAgo } from "@/lib/time"

export type WorldCardData = {
  id: string
  name: string
  description: string | null
  banner: string | null
  ownedByYou: boolean
  messageCount: number
  castCount: number
  lastActive: Date | null
}

/**
 * Someone wrote within this long counts as active. There is no presence
 * tracking, so recent writing is the honest stand-in for "online".
 */
const ACTIVE_WINDOW_MS = 15 * 60 * 1000

/** The worlds someone belongs to, most recently written in first. */
export async function loadWorldCards(userId: string): Promise<WorldCardData[]> {
  const worlds = await prisma.world.findMany({
    where: { members: { some: { userId } } },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      bannerUrl: true,
      bannerUpdatedAt: true,
      createdAt: true,
      _count: { select: { cast: true, messages: { where: { deletedAt: null } } } },
      messages: {
        where: { deletedAt: null },
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { timestamp: true },
      },
    },
  })

  const activity = (w: (typeof worlds)[number]) =>
    (w.messages[0]?.timestamp ?? w.createdAt).getTime()

  return worlds
    .sort((a, b) => activity(b) - activity(a))
    .map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      banner: bannerSrc(w),
      ownedByYou: w.ownerId === userId,
      messageCount: w._count.messages,
      castCount: w._count.cast,
      lastActive: w.messages[0]?.timestamp ?? null,
    }))
}

export function WorldCard({ world }: { world: WorldCardData }) {
  const active = world.lastActive !== null && isWithin(world.lastActive, ACTIVE_WINDOW_MS)

  return (
    <Link
      href={`/worlds/${world.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent/50 hover:shadow-[0_0_30px_-12px_rgba(124,92,255,0.5)] sm:flex-row"
    >
      <div className="relative h-32 shrink-0 overflow-hidden sm:h-auto sm:min-h-36 sm:w-48 lg:w-56">
        {world.banner ? (
          // Banners are arbitrary user-supplied URLs, which next/image rejects.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={world.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(124,92,255,0.35),transparent_70%)]">
            <Globe size={36} className="text-accent-soft/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-surface" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:p-5">
        {world.ownedByYou && (
          <span className="w-fit rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-soft">
            Your World
          </span>
        )}
        <h3 className="truncate font-display text-2xl font-semibold text-ink">{world.name}</h3>
        <p className="line-clamp-2 font-display text-base italic text-muted">
          {world.description ? `“${world.description}”` : "No description yet."}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-muted/40"}`}
              />
              {world.lastActive
                ? active
                  ? "Active now"
                  : `Active ${timeAgo(world.lastActive)}`
                : "No messages yet"}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare size={13} /> {world.messageCount.toLocaleString()}{" "}
              {world.messageCount === 1 ? "Message" : "Messages"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={13} /> {world.castCount} {world.castCount === 1 ? "Character" : "Characters"}
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-medium text-ink transition group-hover:bg-accent group-hover:text-white">
            Continue RP <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function NoWorlds() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
        <Globe size={28} className="text-muted" />
      </div>
      <h3 className="font-display text-2xl font-semibold text-ink">No worlds yet</h3>
      <p className="mt-1 text-sm text-muted">
        Create a new world, import a Telegram chat, or join one with an invite code.
      </p>
    </div>
  )
}
