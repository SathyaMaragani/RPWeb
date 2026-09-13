"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Eye, Pencil, Search, Users, Wand2, X } from "lucide-react"

export type GalleryCharacter = {
  id: string
  name: string
  title: string | null
  bio: string | null
  color: string
  avatar: string | null
  /** The full designed figure, when they have one. */
  portrait: string | null
  /** Created by the viewer, as opposed to shared with them through a world. */
  mine: boolean
  createdAt: string
  worlds: { id: string; name: string }[]
}

const TABS = [
  ["all", "All"],
  ["mine", "Yours"],
  ["shared", "Shared"],
] as const
type Tab = (typeof TABS)[number][0]

const SORTS = { newest: "Newest", oldest: "Oldest", name: "Name" } as const
type Sort = keyof typeof SORTS

const button =
  "flex items-center justify-center gap-1.5 rounded-lg border border-line bg-elevated/60 py-2 text-sm text-ink/90 transition hover:border-accent/50 hover:text-ink"

export default function CharacterGallery({ characters }: { characters: GalleryCharacter[] }) {
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("newest")
  const [viewing, setViewing] = useState<GalleryCharacter | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  if (characters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-elevated">
          <Users size={30} className="text-muted" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-ink">No characters yet</h3>
        <p className="mt-2 text-muted">Create your first one to start writing.</p>
      </div>
    )
  }

  const counts: Record<Tab, number> = {
    all: characters.length,
    mine: characters.filter((c) => c.mine).length,
    shared: characters.filter((c) => !c.mine).length,
  }

  const q = query.trim().toLowerCase()
  const shown = characters
    .filter((c) => tab === "all" || (tab === "mine") === c.mine)
    .filter((c) => !q || [c.name, c.title, c.bio].some((t) => t?.toLowerCase().includes(q)))
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : a.createdAt.localeCompare(b.createdAt)
    )

  const view = (c: GalleryCharacter) => {
    setViewing(c)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div role="tablist" className="flex w-fit gap-1 rounded-xl border border-line bg-surface p-1">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-sm transition ${
                tab === key
                  ? "bg-accent/20 text-ink ring-1 ring-accent/50"
                  : "text-muted hover:text-ink"
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        <label className="relative flex-1">
          <span className="sr-only">Search characters</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters..."
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort"
          className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
        >
          {Object.entries(SORTS).map(([key, label]) => (
            <option key={key} value={key} className="bg-elevated">
              {label}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">No characters match.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <article
              key={c.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent/40"
            >
              <Portrait character={c} className="aspect-[3/2]" />

              <div className="relative -mt-4 flex flex-1 flex-col px-4 pb-4">
                <h3
                  className="truncate font-display text-2xl font-semibold"
                  style={{ color: c.color }}
                >
                  {c.name}
                </h3>
                <div className="truncate text-xs text-muted">{c.title || "No title"}</div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/75">
                  {c.bio || "No bio yet."}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.worlds.map((w) => (
                    <Link
                      key={w.id}
                      href={`/worlds/${w.id}`}
                      className="rounded-md border border-line bg-elevated px-2 py-0.5 text-[11px] text-muted transition hover:text-ink"
                    >
                      {w.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-auto space-y-2 pt-4">
                  <Link
                    href={`/characters/${c.id}/customize`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 py-2 text-sm text-ink transition hover:bg-accent/30"
                  >
                    <Wand2 size={14} /> {c.portrait ? "Change look" : "Design look"}
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => view(c)} className={button}>
                      <Eye size={14} /> View
                    </button>
                    <Link href={`/characters/${c.id}/edit`} className={button}>
                      <Pencil size={14} /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        // A click that lands on the dialog itself, not its contents, is the backdrop.
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {viewing && (
          <div>
            <div className="relative">
              {viewing.portrait ? (
                <div
                  className="flex h-[52vh] justify-center pt-4"
                  style={{ background: `radial-gradient(circle at 50% 40%, ${viewing.color}33, transparent 70%)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewing.portrait} alt={viewing.name} className="h-full w-auto" />
                </div>
              ) : (
                <Portrait character={viewing} className="aspect-square" />
              )}
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5 text-ink backdrop-blur hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
            <div className="-mt-6 relative max-h-[40vh] overflow-y-auto px-5 pb-5">
              <h3 className="font-display text-3xl font-semibold" style={{ color: viewing.color }}>
                {viewing.name}
              </h3>
              <div className="text-sm text-muted">{viewing.title || "No title"}</div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/85">
                {viewing.bio || "No bio yet."}
              </p>
              {viewing.worlds.length > 0 && (
                <div className="mt-4 text-xs text-muted">
                  In {viewing.worlds.map((w) => w.name).join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}

function Portrait({ character: c, className }: { character: GalleryCharacter; className: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(circle at 50% 35%, ${c.color}40, transparent 70%)` }}
    >
      {c.avatar ? (
        // Avatars are arbitrary user-supplied URLs, which next/image rejects.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.avatar}
          alt={c.name}
          className="h-full w-full object-cover object-[center_25%] transition duration-500 group-hover:scale-105"
        />
      ) : (
        <span
          className="flex h-full items-center justify-center font-display text-7xl font-semibold"
          style={{ color: c.color }}
        >
          {c.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent" />
      <span
        className={`absolute right-2.5 top-2.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${
          c.mine
            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
            : "border-sky-400/40 bg-sky-500/15 text-sky-300"
        }`}
      >
        {c.mine ? "Yours" : "Shared"}
      </span>
    </div>
  )
}
