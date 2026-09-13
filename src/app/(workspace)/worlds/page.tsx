import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { requireUserId } from "@/server/auth-guards"
import { PageHeader } from "@/components/layout/PageHeader"
import { NoWorlds, WorldCard, loadWorldCards } from "@/components/worlds/WorldCard"

export default async function WorldsPage() {
  const userId = await requireUserId()
  const worlds = await loadWorldCards(userId)

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 lg:p-10">
      <PageHeader
        eyebrow="Worlds"
        title="Your Worlds"
        subtitle="The stories you are part of."
        quote="Every world begins with a single line."
        action={
          <div className="flex gap-2">
            <Link
              href="/worlds/join"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/50"
            >
              <Users size={17} /> Join World
            </Link>
            <Link
              href="/worlds/new"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(124,92,255,0.7)] transition hover:bg-accent-soft"
            >
              <Plus size={17} /> Create World
            </Link>
          </div>
        }
      />

      {worlds.length === 0 ? (
        <NoWorlds />
      ) : (
        <div className="space-y-3">
          {worlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </div>
      )}
    </div>
  )
}
