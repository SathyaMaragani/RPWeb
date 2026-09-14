"use client"

import { useDeferredValue, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Ban,
  Check,
  Gem,
  Loader2,
  PersonStanding,
  Redo2,
  RotateCcw,
  Scissors,
  Shirt,
  Shuffle,
  Smile,
  Sparkles,
  Sword,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { saveAppearance } from "@/server/actions/characters"
import {
  BUST_VIEW,
  CATEGORIES,
  PRESETS,
  COLOR_SLOTS,
  DEFAULT_APPEARANCE,
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  SLOTS,
  assetsFor,
  composeSvg,
  getAsset,
  paletteFor,
  randomAppearance,
  svgDataUri,
  withPart,
  withPartColor,
  type Appearance,
  type Category,
  type ColorSlot,
  type SlotDef,
  type SlotId,
} from "@/lib/appearance"

const HISTORY_LIMIT = 60
const ZOOM_MIN = 1
const ZOOM_MAX = 2.5

const CATEGORY_ICONS: Record<Category, typeof Smile> = {
  Body: PersonStanding,
  Face: Smile,
  Hair: Scissors,
  Clothes: Shirt,
  Accessories: Gem,
  Weapons: Sword,
  Fantasy: Sparkles,
}

const COLOR_LABELS: Record<ColorSlot, string> = { primary: "Main", secondary: "Accent", trim: "Trim" }

type GlobalColor = "skin" | "hair" | "eyes"

/** Colours that belong to the whole character, shown with the section they affect. */
const GLOBAL_COLORS: Partial<Record<SlotId, { key: GlobalColor; label: string; palette: string[] }>> = {
  body: { key: "skin", label: "Skin tone", palette: SKIN_TONES },
  eyes: { key: "eyes", label: "Eye colour", palette: EYE_COLORS },
  hair: { key: "hair", label: "Hair colour", palette: HAIR_COLORS },
}

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface/80 text-muted backdrop-blur transition hover:text-ink disabled:opacity-40 disabled:hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

/**
 * The character studio: pick a part per slot, recolour it, see it at once.
 *
 * Everything happens in the browser against the built-in catalogue; the server
 * is only involved when saving. Every change goes on an undo stack, so trying
 * things is never risky.
 */
export default function CharacterStudio({
  characterId,
  name,
  initial,
  hasSaved,
}: {
  characterId: string
  name: string
  initial: Appearance
  hasSaved: boolean
}) {
  const [history, setHistory] = useState<Appearance[]>([initial])
  const [index, setIndex] = useState(0)
  const [category, setCategory] = useState<Category>("Body")
  const [zoom, setZoom] = useState(1)
  const [rolling, setRolling] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  // What is stored, to tell whether there is anything to save. A character
  // never designed has nothing stored, so even the starting look is unsaved.
  const [savedJson, setSavedJson] = useState(hasSaved ? JSON.stringify(initial) : "")
  // Dragging a colour picker fires a change per pixel; those collapse into
  // one undo step while they keep coming.
  const mergeRef = useRef<{ key: string; at: number } | null>(null)

  const current = history[index]
  // Thumbnails re-render for every change; letting them trail a frame keeps
  // the preview and the colour picker immediate.
  const deferred = useDeferredValue(current)
  const dirty = JSON.stringify(current) !== savedJson
  const canUndo = index > 0
  const canRedo = index < history.length - 1

  const commit = (next: Appearance, mergeKey?: string) => {
    const now = Date.now()
    const merge =
      mergeKey !== undefined &&
      mergeRef.current?.key === mergeKey &&
      now - mergeRef.current.at < 800 &&
      !canRedo
    mergeRef.current = mergeKey ? { key: mergeKey, at: now } : null
    if (status !== "saving") setStatus("idle")

    if (merge) {
      setHistory([...history.slice(0, -1), next])
      return
    }
    const trimmed = [...history.slice(0, index + 1), next].slice(-HISTORY_LIMIT)
    setHistory(trimmed)
    setIndex(trimmed.length - 1)
  }

  const undo = () => {
    if (!canUndo) return
    mergeRef.current = null
    setIndex(index - 1)
    setStatus("idle")
  }
  const redo = () => {
    if (!canRedo) return
    mergeRef.current = null
    setIndex(index + 1)
    setStatus("idle")
  }

  const randomize = () => {
    setRolling(true)
    commit(randomAppearance())
    setTimeout(() => setRolling(false), 220)
  }

  const reset = () => {
    if (window.confirm("Reset to the starting look? You can still undo this.")) {
      commit(DEFAULT_APPEARANCE)
    }
  }

  const save = async () => {
    setStatus("saving")
    try {
      await saveAppearance(characterId, current)
      setSavedJson(JSON.stringify(current))
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }

  // Keyboard undo and redo, outside text fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest("textarea, input[type=text]")) return
      const key = e.key.toLowerCase()
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // Closing the tab with an unsaved design asks first.
  useEffect(() => {
    if (!dirty) return
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onLeave)
    return () => window.removeEventListener("beforeunload", onLeave)
  }, [dirty])

  const setZoomClamped = (z: number) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)))

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-3 py-2.5 backdrop-blur md:px-5">
        <Link href="/characters" aria-label="Back to characters" title="Back to characters" className={iconButton}>
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-soft sm:block">
            Character studio
          </div>
          <h1 className="truncate text-base font-semibold text-ink md:text-xl">{name}</h1>
        </div>

        <span aria-live="polite" className="hidden text-xs text-muted sm:inline">
          {status === "error" ? (
            <span className="text-red-400">Could not save. Try again.</span>
          ) : dirty && status !== "saving" ? (
            "Unsaved changes"
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving" || (!dirty && status !== "error")}
          className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(124,92,255,0.7)] transition hover:bg-accent-soft disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {status === "saving" ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Saving...
            </>
          ) : status === "saved" && !dirty ? (
            <>
              <Check size={15} /> Saved
            </>
          ) : (
            "Save"
          )}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[180px_minmax(0,1fr)_400px]">
        {/* Categories: tabs under the preview on a phone, a list on the left on a desktop. */}
        <nav
          aria-label="Categories"
          className="order-2 flex shrink-0 gap-1 overflow-x-auto border-y border-line bg-surface px-2 py-2 lg:order-1 lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:border-y-0 lg:border-r lg:px-3 lg:py-4"
        >
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c]
            const active = c === category
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-current={active ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-accent ${
                  active
                    ? "bg-gradient-to-r from-accent/30 to-accent/5 text-ink ring-1 ring-inset ring-accent/40"
                    : "text-muted hover:bg-elevated hover:text-ink"
                }`}
              >
                <Icon size={16} className={active ? "text-accent-soft" : undefined} />
                {c}
              </button>
            )
          })}
        </nav>

        <section
          aria-label="Preview"
          // Neutral on purpose: the character's colours are theirs, not the app's.
          className="relative order-1 h-[46dvh] shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.09),transparent_65%)] lg:order-2 lg:h-auto lg:min-h-0"
        >
          <div className="absolute inset-x-0 bottom-[4%] mx-auto h-[5%] w-1/3 rounded-[50%] bg-black/50 blur-md" />
          <div className="flex h-full items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={svgDataUri(composeSvg(current))}
              alt={`${name}, as designed`}
              className={`h-[94%] w-auto max-w-none transition duration-200 ease-out ${rolling ? "opacity-60" : "opacity-100"}`}
              style={{ transform: `scale(${zoom * (rolling ? 0.96 : 1)})`, transformOrigin: "50% 24%" }}
            />
          </div>

          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className={iconButton}>
              <Undo2 size={16} />
            </button>
            <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Y)" className={iconButton}>
              <Redo2 size={16} />
            </button>
            <button
              type="button"
              onClick={randomize}
              aria-label="Randomise"
              title="Randomise the look"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 px-2.5 text-sm text-ink backdrop-blur transition hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3"
            >
              <Shuffle size={15} />
              {/* Icon only on a phone, where both control groups share one row. */}
              <span className="hidden sm:inline">Randomise</span>
            </button>
            <button type="button" onClick={reset} aria-label="Reset appearance" title="Reset appearance" className={iconButton}>
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <button type="button" onClick={() => setZoomClamped(zoom - 0.5)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out" title="Zoom out" className={iconButton}>
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              title="Reset zoom"
              className="h-9 min-w-12 rounded-lg border border-line bg-surface/80 px-2 text-xs text-muted backdrop-blur hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              {zoom}×
            </button>
            <button type="button" onClick={() => setZoomClamped(zoom + 0.5)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in" title="Zoom in" className={iconButton}>
              <ZoomIn size={16} />
            </button>
          </div>
        </section>

        <div className="order-3 min-h-0 flex-1 space-y-7 overflow-y-auto p-4 lg:border-l lg:border-line lg:p-5">
          {category === "Body" && (
            <section aria-labelledby="slot-presets">
              <div className="mb-2.5 flex items-baseline justify-between gap-2">
                <h2 id="slot-presets" className="text-sm font-semibold text-ink">
                  Starting looks
                </h2>
                <span className="truncate text-xs text-muted">Pick one, then make it yours</span>
              </div>
              <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
                {PRESETS.map((preset) => (
                  <Thumb
                    key={preset.id}
                    label={preset.name}
                    selected={JSON.stringify(preset.appearance) === JSON.stringify(current)}
                    onSelect={() => commit(preset.appearance)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={svgDataUri(composeSvg(preset.appearance, BUST_VIEW))}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </Thumb>
                ))}
              </div>
            </section>
          )}
          {SLOTS.filter((s) => s.category === category).map((slot) => (
            <SlotSection
              key={slot.id}
              slot={slot}
              appearance={current}
              thumbsFor={deferred}
              onChange={commit}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotSection({
  slot,
  appearance,
  thumbsFor,
  onChange,
}: {
  slot: SlotDef
  appearance: Appearance
  thumbsFor: Appearance
  onChange: (next: Appearance, mergeKey?: string) => void
}) {
  const part = appearance.parts[slot.id]
  const asset = getAsset(part?.id)
  const global = GLOBAL_COLORS[slot.id]

  return (
    <section aria-labelledby={`slot-${slot.id}`}>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h2 id={`slot-${slot.id}`} className="text-sm font-semibold text-ink">
          {slot.label}
        </h2>
        <span className="truncate text-xs text-muted">{asset?.name ?? "None"}</span>
      </div>

      {global && (
        <div className="mb-3">
          <ColorRow
            label={global.label}
            value={appearance[global.key]}
            palette={global.palette}
            onPick={(color, live) =>
              onChange({ ...appearance, [global.key]: color }, live ? `global:${global.key}` : undefined)
            }
          />
        </div>
      )}

      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {slot.optional && (
          <Thumb
            label="None"
            selected={!part}
            onSelect={() => onChange(withPart(appearance, slot.id, null))}
          >
            <Ban size={22} className="text-muted" />
          </Thumb>
        )}
        {assetsFor(slot.id).map((a) => (
          <Thumb
            key={a.id}
            label={a.name}
            selected={part?.id === a.id}
            onSelect={() => onChange(withPart(appearance, slot.id, a.id))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={svgDataUri(composeSvg(withPart(thumbsFor, slot.id, a.id), slot.view))}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </Thumb>
        ))}
      </div>

      {asset?.colors && part && (
        <div className="mt-3 space-y-3">
          {COLOR_SLOTS.filter((key) => asset.colors?.[key]).map((key) => (
            <ColorRow
              key={key}
              label={COLOR_LABELS[key]}
              value={part.colors?.[key] ?? asset.colors![key]!}
              palette={paletteFor(asset, key)}
              onPick={(color, live) =>
                onChange(withPartColor(appearance, slot.id, key, color), live ? `${slot.id}:${key}` : undefined)
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}

function Thumb({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      className={`group relative flex w-24 shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-canvas/60 transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:w-auto ${
        selected ? "border-accent ring-2 ring-accent/60" : "border-line hover:border-accent/50"
      }`}
    >
      <span className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_70%)] p-1.5">
        {children}
      </span>
      <span className={`truncate px-1.5 pb-1.5 text-[11px] ${selected ? "text-ink" : "text-muted"}`}>{label}</span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

function ColorRow({
  label,
  value,
  palette,
  onPick,
}: {
  label: string
  value: string
  palette: readonly string[]
  onPick: (color: string, live?: boolean) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              onClick={() => onPick(color)}
              aria-label={`${label} ${color}`}
              aria-pressed={selected}
              title={color}
              style={{ backgroundColor: color }}
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
              }`}
            >
              {selected && <Check size={14} strokeWidth={3} className="text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]" />}
            </button>
          )
        })}
        <label
          title="Pick any colour"
          className="flex h-8 items-center gap-1.5 rounded-full border border-line px-2.5 text-xs text-muted focus-within:outline-2 focus-within:outline-accent"
        >
          Custom
          <input
            type="color"
            value={value}
            onChange={(e) => onPick(e.target.value, true)}
            aria-label={`${label}: custom colour`}
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
    </div>
  )
}
