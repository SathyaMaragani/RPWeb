"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, BookOpen, FileUp, Loader2 } from "lucide-react"
import { cardFromPng, parseCard, type ImportedCard } from "@/lib/cards"
import { AVATAR_SIZE, estimateTokens } from "@/lib/characters"
import { importCharacterCard } from "@/server/actions/characters"

/** Largest file accepted; real cards are well under this. */
const MAX_FILE_BYTES = 15 * 1024 * 1024

/**
 * Crops the card picture to a square from the top (faces sit near the top of
 * portrait cards) and stores it at the avatar size, like any upload.
 */
async function avatarFromImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = Math.min(AVATAR_SIZE, side)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("This browser cannot process images.")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, 0, side, side, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/webp", 0.85)
}

export default function ImportCard() {
  const router = useRouter()
  const [raw, setRaw] = useState<unknown>(null)
  const [card, setCard] = useState<ImportedCard | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file: File) => {
    setError(null)
    setCard(null)
    setAvatar(null)
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("That file is too large to be a character card.")
      const bytes = new Uint8Array(await file.arrayBuffer())
      const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png")
      const parsedRaw = isPng ? cardFromPng(bytes) : JSON.parse(new TextDecoder().decode(bytes))
      setCard(parseCard(parsedRaw))
      setRaw(parsedRaw)
      if (isPng) setAvatar(await avatarFromImage(file))
    } catch (e) {
      setError(e instanceof SyntaxError ? "That file isn't valid JSON." : e instanceof Error ? e.message : "Could not read that file.")
    }
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { id } = await importCharacterCard(raw, avatar)
      router.push(`/characters/${id}/edit`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import the card.")
      setBusy(false)
    }
  }

  const fields: [string, string | null][] = card
    ? [
        ["Description", card.bio],
        ["Personality", card.personality],
        ["Scenario", card.scenario],
        ["First message", card.greeting],
        ["Example dialogue", card.exampleDialogue],
      ]
    : []

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-canvas/50 px-6 py-10 text-center transition hover:border-accent/60">
        <FileUp size={28} className="text-accent-soft" />
        <span className="text-sm font-medium text-ink">Choose a card file</span>
        <span className="text-xs text-muted">.png or .json</span>
        <input
          type="file"
          accept=".png,.json,image/png,application/json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void pick(file)
            e.target.value = ""
          }}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      {card && (
        <div className="space-y-4 rounded-2xl border border-line bg-canvas p-5">
          <div className="flex items-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-xl font-semibold text-muted">
                {card.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-ink">{card.name}</div>
              <div className="text-xs text-muted">{card.tags.length ? card.tags.join(", ") : "No tags"}</div>
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line/60 pb-2">
                <dt className="text-muted">{label}</dt>
                <dd className="text-ink">{value ? `~${estimateTokens(value).toLocaleString()} tokens` : "—"}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-muted">
                <BookOpen size={14} /> Lorebook
              </dt>
              <dd className="text-ink">
                {card.lorebook.length ? `${card.lorebook.length} entries` : "none"}
              </dd>
            </div>
          </dl>

          {card.warnings.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {card.warnings.map((w) => (
                <li key={w} className="flex gap-2">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition hover:bg-accent-soft disabled:opacity-50"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Import {card.name}
          </button>
        </div>
      )}
    </div>
  )
}
