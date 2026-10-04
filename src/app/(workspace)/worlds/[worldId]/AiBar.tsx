"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { BookOpen, Bot, ChevronRight, Loader2, Settings2, Sparkles, X } from "lucide-react"
import { setCharacterAi, updateWorldAi } from "@/server/actions/ai"
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/prompt"

export type AiCastMember = { id: string; name: string; aiEnabled: boolean; hasGreeting: boolean }
export type AiPersona = { id: string; name: string; isDefault: boolean }
export type AiWorldSettings = { memory: string | null; systemPrompt: string | null; summary: string | null }

/**
 * Controls for AI-played characters: who replies, as which persona, and the
 * world's memory and instructions. Sits above the composer so it is reachable
 * on every screen size.
 */
export default function AiBar({
  worldId,
  cast,
  personas,
  hasModel,
  settings,
  writing,
  error,
  onAsk,
  personaId,
  onPersonaChange,
}: {
  worldId: string
  cast: AiCastMember[]
  personas: AiPersona[]
  hasModel: boolean
  settings: AiWorldSettings
  /** The character currently being written for, if any. */
  writing: string | null
  error: string | null
  onAsk: (characterId: string) => void
  personaId: string
  onPersonaChange: (id: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const ai = cast.filter((c) => c.aiEnabled)

  const toggle = async (c: AiCastMember) => {
    setBusy(c.id)
    try {
      await setCharacterAi(worldId, c.id, !c.aiEnabled)
    } finally {
      setBusy(null)
    }
  }

  const saveSettings = async (formData: FormData) => {
    setBusy("settings")
    try {
      await updateWorldAi(worldId, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="shrink-0 border-t border-line bg-surface/50 px-3 py-1.5 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-1.5">
        {ai.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onAsk(c.id)}
            disabled={writing !== null || !hasModel}
            title={hasModel ? `Have the AI write ${c.name}'s next message` : "Add an AI model in Settings first"}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-xs font-medium text-ink transition hover:bg-accent/30 disabled:opacity-50"
          >
            {writing === c.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {writing === c.id ? `${c.name} is writing...` : `${c.name} replies`}
          </button>
        ))}

        {ai.length > 0 && personas.length > 0 && (
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="hidden sm:inline">as</span>
            <select
              value={personaId}
              onChange={(e) => onPersonaChange(e.target.value)}
              aria-label="Persona the AI is talking to"
              className="rounded-full border border-line bg-elevated px-2 py-1 text-xs text-ink focus:outline-none"
            >
              <option value="">your character</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-muted transition hover:text-ink"
        >
          {ai.length ? <Settings2 size={13} /> : <Bot size={13} />}
          {ai.length ? "AI settings" : "Add an AI character"}
        </button>
      </div>

      {error && <p className="mx-auto mt-1 max-w-4xl text-xs text-red-400">{error}</p>}

      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto w-[min(94vw,32rem)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="max-h-[85vh] space-y-5 overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">AI in this world</h2>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="text-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>

          {!hasModel && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              AI replies use your own API key.{" "}
              <Link href="/settings#ai-models" className="font-semibold underline">
                Add a model in Settings
              </Link>{" "}
              first.
            </p>
          )}

          <section className="space-y-2">
            <div className="text-sm font-medium">Who the AI plays</div>
            <p className="text-xs text-muted">
              Anyone in the world can ask an AI-played character to reply. Their character card (personality,
              scenario, first message) guides how they write.
            </p>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {cast.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="truncate text-sm">{c.name}</span>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    {busy === c.id && <Loader2 size={12} className="animate-spin" />}
                    AI plays
                    <input
                      type="checkbox"
                      checked={c.aiEnabled}
                      disabled={busy !== null}
                      onChange={() => void toggle(c)}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <Link
            href={`/worlds/${worldId}/lore`}
            className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm transition hover:border-accent/50"
          >
            <BookOpen size={16} className="text-accent-soft" />
            <span className="flex-1">
              Lorebook
              <span className="block text-xs text-muted">Places, factions and history, given to the AI only when mentioned</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>

          <form action={saveSettings} className="space-y-3">
            <label className="block text-sm font-medium">
              Memory
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Facts every AI reply should keep straight. Pinned to each request.
              </span>
              <textarea
                name="memory"
                rows={4}
                maxLength={8000}
                defaultValue={settings.memory ?? ""}
                placeholder="Kael is secretly in love with Aria. They are travelling to the northern kingdom."
                className="mt-1.5 block w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm placeholder-muted focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium">
              Story so far
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Written automatically as the chat outgrows what fits in one request, so early events aren&rsquo;t
                forgotten. You can correct it; clear it to rebuild from the first message.
              </span>
              <textarea
                name="summary"
                rows={4}
                maxLength={6000}
                defaultValue={settings.summary ?? ""}
                placeholder="Nothing yet. It appears once the story is long enough to need it."
                className="mt-1.5 block w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm placeholder-muted focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium">
              Custom instructions
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Replaces the default instructions. {"{{char}}"}, {"{{user}}"}, {"{{persona}}"} and {"{{scenario}}"} are filled in.
              </span>
              <textarea
                name="systemPrompt"
                rows={4}
                maxLength={8000}
                defaultValue={settings.systemPrompt ?? ""}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                className="mt-1.5 block w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm placeholder-muted focus:border-accent focus:outline-none"
              />
            </label>
            <button
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-soft disabled:opacity-50"
            >
              {busy === "settings" && <Loader2 size={14} className="animate-spin" />}
              {saved ? "Saved" : "Save"}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  )
}
