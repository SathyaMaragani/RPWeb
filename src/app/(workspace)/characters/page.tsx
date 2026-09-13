import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"
import { characterColor, avatarSrc, portraitSrc } from "@/lib/characters"
import { PageHeader } from "@/components/layout/PageHeader"
import CharacterGallery from "./CharacterGallery"

export default async function CharactersPage() {
  const userId = await requireUserId()

  // Everything this person can write as: what they created, plus the cast of
  // every world they are in — those are shared and equally theirs to use.
  const characters = await prisma.character.findMany({
    where: {
      OR: [
        { userId },
        { worlds: { some: { world: { members: { some: { userId } } } } } },
      ],
    },
    include: { worlds: { include: { world: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 lg:p-10">
      <PageHeader
        eyebrow="Characters"
        title="Your Characters"
        subtitle="Shared with everyone in the worlds they belong to."
        quote="Characters are the soul of every story."
        action={
          <Link
            href="/characters/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(124,92,255,0.7)] transition hover:bg-accent-soft"
          >
            <Plus size={18} /> Create Character
          </Link>
        }
      />

      <CharacterGallery
        characters={characters.map((c) => ({
          id: c.id,
          name: c.name,
          title: c.title,
          bio: c.bio,
          color: characterColor(c),
          avatar: avatarSrc(c),
          portrait: portraitSrc(c),
          mine: c.userId === userId,
          createdAt: c.createdAt.toISOString(),
          worlds: c.worlds.map((w) => w.world),
        }))}
      />

      <aside className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-surface bg-[radial-gradient(ellipse_at_right,rgba(124,92,255,0.18),transparent_60%)] p-5 md:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-soft ring-1 ring-accent/30">
          <Users size={22} />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-ink">Shared Characters</h2>
          <p className="text-sm text-muted">
            Characters can be used by anyone in the worlds they belong to.
          </p>
        </div>
      </aside>
    </div>
  )
}
