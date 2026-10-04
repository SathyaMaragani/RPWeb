import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BookOpen, Pin, Plus, Trash2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"
import { createLoreEntry, deleteLoreEntry, updateLoreEntry } from "@/server/actions/lore"
import { LORE_BUDGET, LORE_SCAN_DEPTH } from "@/lib/ai/lore"
import { estimateTokens } from "@/lib/characters"
import { PageHeader } from "@/components/layout/PageHeader"
import LoreTransfer from "./LoreTransfer"

type EntryDefaults = {
  name: string
  keywords: string
  content: string
  constant: boolean
  enabled: boolean
  caseSensitive: boolean
  wholeWord: boolean
  priority: number
}

const BLANK: EntryDefaults = {
  name: "",
  keywords: "",
  content: "",
  constant: false,
  enabled: true,
  caseSensitive: false,
  wholeWord: true,
  priority: 0,
}

const input =
  "mt-1 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"

function EntryFields({ entry }: { entry: EntryDefaults }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Name
          <input name="name" required maxLength={80} defaultValue={entry.name} placeholder="Vermillion Kingdom" className={input} />
        </label>
        <label className="block text-xs text-muted">
          Keywords <span>(comma separated)</span>
          <input name="keywords" defaultValue={entry.keywords} placeholder="Vermillion, the capital" className={input} />
        </label>
      </div>
      <label className="block text-xs text-muted">
        What the AI should know
        <textarea
          name="content"
          required
          rows={4}
          maxLength={6000}
          defaultValue={entry.content}
          placeholder="The Vermillion Kingdom is ruled by Queen Aster from a city of red stone. {{char}} was exiled from it."
          className={input}
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="constant" defaultChecked={entry.constant} className="accent-[var(--color-accent)]" />
          Always included
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="wholeWord" defaultChecked={entry.wholeWord} className="accent-[var(--color-accent)]" />
          Whole words only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="caseSensitive" defaultChecked={entry.caseSensitive} className="accent-[var(--color-accent)]" />
          Match case
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="enabled" defaultChecked={entry.enabled} className="accent-[var(--color-accent)]" />
          Enabled
        </label>
        <label className="flex items-center gap-2">
          Priority
          <input
            name="priority"
            type="number"
            min={-100}
            max={100}
            step={1}
            defaultValue={entry.priority}
            className="w-16 rounded-lg border border-line bg-canvas px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
          />
        </label>
      </div>
    </div>
  )
}

export default async function LorePage(props: PageProps<"/worlds/[worldId]/lore">) {
  const userId = await requireUserId()
  const { worldId } = await props.params

  const member = await prisma.worldMember.findUnique({
    where: { worldId_userId: { worldId, userId } },
    select: {
      world: {
        select: {
          name: true,
          lore: { orderBy: [{ constant: "desc" }, { priority: "desc" }, { name: "asc" }] },
        },
      },
    },
  })
  if (!member) redirect("/worlds")
  const { world } = member

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 lg:p-10">
      <Link href={`/worlds/${worldId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back to {world.name}
      </Link>
      <PageHeader
        eyebrow="Lorebook"
        title={`${world.name} lore`}
        subtitle={`Knowledge AI characters get only when it's relevant: an entry is added when one of its keywords appears in the last ${LORE_SCAN_DEPTH} messages. Up to about ${estimateTokens("x".repeat(LORE_BUDGET)).toLocaleString()} tokens of lore per reply, highest priority first.`}
      />

      <LoreTransfer worldId={worldId} worldName={world.name} />

      <details open={world.lore.length === 0} className="mb-6 rounded-2xl border border-dashed border-line bg-surface p-4 open:space-y-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-accent-soft">
          <Plus size={16} /> New entry
        </summary>
        <form action={createLoreEntry.bind(null, worldId)} className="space-y-4">
          <EntryFields entry={BLANK} />
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-soft">
            Add entry
          </button>
        </form>
      </details>

      {world.lore.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 p-10 text-center">
          <BookOpen size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">No lore yet. Add places, factions, history and magic rules.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {world.lore.map((entry) => (
            <li key={entry.id}>
              <details className="rounded-2xl border border-line bg-surface p-4 open:space-y-4">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      {entry.name}
                      {entry.constant && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-soft">
                          <Pin size={10} /> Always
                        </span>
                      )}
                      {!entry.enabled && (
                        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">Off</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {entry.keywords.length ? entry.keywords.join(", ") : "no keywords"} · ~
                      {estimateTokens(entry.content)} tokens
                    </div>
                  </div>
                  <span className="text-xs text-muted">Edit</span>
                </summary>
                <form action={updateLoreEntry.bind(null, entry.id)} className="space-y-4">
                  <EntryFields entry={{ ...entry, keywords: entry.keywords.join(", ") }} />
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-soft">
                      Save
                    </button>
                    <button
                      formAction={deleteLoreEntry.bind(null, entry.id)}
                      formNoValidate
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-muted hover:border-red-500/40 hover:text-red-400"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
