"use client"

import { useState } from "react"
import { BookOpen, Copy, Check, Crown, Info, Pencil, Settings, X, Loader2, UserPlus } from "lucide-react"
import { Avatar } from "@/components/layout/Sidebar"
import { updateWorld, addCharacterToWorld } from "@/server/actions/worlds"
import { characterColor, fallbackColor, BANNER_WIDTH, BANNER_ASPECT } from "@/lib/characters"
import ImagePicker from "@/components/media/ImagePicker"

export type PanelParticipant = {
  characterId: string
  name: string
  avatarUrl: string | null
  color: string | null
  title: string | null
  role: string | null
  isYou: boolean
}

/** One of your characters that is not in this world yet. */
export type AddableCharacter = {
  id: string
  name: string
  color: string | null
}

export type PanelWorld = {
  id: string
  name: string
  description: string | null
  /** External banner URL, if one was set instead of an upload. */
  bannerUrl: string | null
  /** Where the current banner loads from, upload or URL. */
  bannerSrc: string | null
  inviteCode: string
  createdAt: string
  importedAt: string | null
}

export default function WorldInfoPanel({
  world,
  participants,
  addableCharacters,
  messageCount,
}: {
  world: PanelWorld
  participants: PanelParticipant[]
  addableCharacters: AddableCharacter[]
  messageCount: number
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A freshly cropped banner, as a data URL. Empty string means "remove";
  // null means "leave whatever is stored alone".
  const [croppedBanner, setCroppedBanner] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toAdd, setToAdd] = useState("")
  const shownBanner = croppedBanner === null ? world.bannerSrc : croppedBanner || null

  const copy = async (what: "code" | "link") => {
    const value =
      what === "code"
        ? world.inviteCode
        : `${window.location.origin}/worlds/join?code=${world.inviteCode}`
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError("Could not copy to the clipboard")
    }
  }

  const save = async (formData: FormData) => {
    setSaving(true)
    setError(null)
    try {
      await updateWorld(world.id, formData)
      setEditing(false)
      setCroppedBanner(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString()

  const addCharacter = async () => {
    const characterId = toAdd || addableCharacters[0]?.id
    if (!characterId) return
    setAdding(true)
    setError(null)
    try {
      await addCharacterToWorld(world.id, characterId)
      setToAdd("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add that character")
    } finally {
      setAdding(false)
    }
  }

  return (
    <aside className="hidden xl:flex min-h-0 w-[340px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Info size={16} className="text-accent" />
        World Info
      </div>

      <section className="rounded-2xl border border-line bg-elevated/50">
        {/* Clip the banner alone, so its corners stay rounded without the
            section cropping anything that follows it. */}
        <div className="overflow-hidden rounded-t-2xl">
          <WorldBanner name={world.name} url={shownBanner} />
        </div>

        <div className="space-y-3 p-4">
          {editing ? (
            <form action={save} className="space-y-3">
              <Field label="Name" name="name" defaultValue={world.name} required />
              <Field
                label="Description"
                name="description"
                defaultValue={world.description ?? ""}
                textarea
              />
              <div>
                <span className="text-xs font-medium text-muted">Banner</span>
                {/* Absent unless touched, so saving the name leaves an
                    uploaded banner in place. */}
                {croppedBanner !== null && (
                  <input type="hidden" name="bannerImage" value={croppedBanner} />
                )}
                <div className="mt-1.5">
                  <ImagePicker
                    value={shownBanner}
                    hasExisting={Boolean(shownBanner || world.bannerUrl)}
                    viewportWidth={276}
                    aspect={BANNER_ASPECT}
                    outputWidth={BANNER_WIDTH}
                    quality={0.82}
                    uploadLabel="Upload banner"
                    changeLabel="Change banner"
                    onChange={(dataUrl: string) => setCroppedBanner(dataUrl)}
                    onClear={() => setCroppedBanner("")}
                  />
                </div>
              </div>

              <Field
                label="Banner image URL"
                name="bannerUrl"
                defaultValue={world.bannerUrl ?? ""}
                placeholder="https://... (used when none uploaded)"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-soft disabled:opacity-50"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setError(null)
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink">{world.name}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {world.description || "No description yet."}
                </p>
              </div>
              {/* Shown to every member: only members reach this page at all,
                  and the world is theirs to shape as much as the owner's. */}
              <button
                onClick={() => setEditing(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-ink"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-elevated/50 p-4">
        <div className="text-xs font-medium text-muted">Invite Code</div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-2xl font-bold tracking-widest text-accent-soft">
            {world.inviteCode}
          </span>
          <button
            onClick={() => copy("code")}
            title="Copy code"
            className="rounded-lg border border-line p-2 text-muted transition hover:text-ink"
          >
            {copied === "code" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        <button
          onClick={() => copy("link")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-soft"
        >
          {copied === "link" ? <Check size={15} /> : <Copy size={15} />}
          {copied === "link" ? "Copied!" : "Copy Invite Link"}
        </button>
      </section>

      {/* Fixed-size tiles, so overflow-hidden here only rounds the corners. */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        <Stat label="Messages" value={String(messageCount)} />
        <Stat label="Members" value={String(participants.length)} />
        <Stat
          label="Imported"
          value={world.importedAt ? formatDate(world.importedAt) : "—"}
        />
        <Stat label="Created" value={formatDate(world.createdAt)} />
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-elevated/50 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ink">
            Cast <span className="text-muted">({participants.length})</span>
          </span>
          <span className="text-[11px] text-muted">anyone can write as these</span>
        </div>
        <ul className="space-y-2">
          {participants.map((p) => (
            <li key={p.characterId} className="flex items-center gap-3">
              <Avatar
                name={p.name}
                src={p.avatarUrl}
                size={34}
                ring={characterColor({ id: p.characterId, color: p.color })}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: characterColor({ id: p.characterId, color: p.color }) }}
                  >
                    {p.name}
                  </span>
                  {p.role === "OWNER" && <Crown size={12} className="shrink-0 text-amber-400" />}
                  {p.isYou && (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft">
                      You
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">
                  {p.title || (p.role === "OWNER" ? "World Owner" : p.role ? "Member" : "Shared character")}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {addableCharacters.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="text-[11px] text-muted">Bring another of your characters in</div>
            <div className="flex gap-2">
              <select
                value={toAdd || addableCharacters[0].id}
                onChange={(e) => setToAdd(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              >
                {addableCharacters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-elevated">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void addCharacter()}
                disabled={adding}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent/50 disabled:opacity-50"
              >
                {adding ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                Add
              </button>
            </div>
          </div>
        )}
      </section>

      <a
        href={`/worlds/${world.id}/lore`}
        className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <BookOpen size={15} /> Lorebook
      </a>

      <a
        href="/characters"
        className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <Settings size={15} /> Customise characters
      </a>
    </aside>
  )
}

/** Banner art if one is set, otherwise a gradient derived from the world name. */
function WorldBanner({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // A world banner is an arbitrary user-supplied URL.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="h-32 w-full object-cover" />
    )
  }
  // No banner set: derive a stable gradient from the world's name so each
  // world still looks like itself.
  const seed = fallbackColor(name)
  return (
    <div
      className="h-32 w-full"
      style={{ background: `linear-gradient(135deg, ${seed}33, #12121c)` }}
    />
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-elevated/50 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  textarea,
}: {
  label: string
  name: string
  defaultValue: string
  placeholder?: string
  required?: boolean
  textarea?: boolean
}) {
  const className =
    "mt-1 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      {textarea ? (
        <textarea name={name} rows={3} defaultValue={defaultValue} className={className} />
      ) : (
        <input
          name={name}
          type="text"
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  )
}
