import {
  BODY_LAYERS,
  CANVAS_WIDTH,
  CLOTH_COLORS,
  COLOR_SLOTS,
  EYE_COLORS,
  FULL_VIEW,
  HAIR_COLORS,
  HEX,
  LAYERS,
  LINE,
  METAL_COLORS,
  SKIN_TONES,
  SLOTS,
  colorFamily,
  type Appearance,
  type Asset,
  type ColorSlot,
  type Layer,
  type Part,
  type SlotId,
} from "./core"
import { BODY_ASSETS } from "./assets/body"
import { HAIR_ASSETS } from "./assets/hair"
import { CLOTHING_ASSETS } from "./assets/clothes"
import { EXTRA_ASSETS } from "./assets/extras"
import { IMPORTED_ASSETS } from "./assets/imported"

export * from "./core"
export { PRESETS } from "./presets"

const importedIds = new Set(IMPORTED_ASSETS.map((a) => a.id))

/**
 * Every asset. Artwork imported from art/characters replaces a built-in asset
 * with the same id, so a drawn version can stand in for a coded one without
 * breaking anyone's saved look.
 */
export const ASSETS: Asset[] = [
  ...[...BODY_ASSETS, ...HAIR_ASSETS, ...CLOTHING_ASSETS, ...EXTRA_ASSETS].filter((a) => !importedIds.has(a.id)),
  ...IMPORTED_ASSETS,
]

const BY_ID = new Map(ASSETS.map((a) => [a.id, a]))

export const getAsset = (id: string | undefined) => (id ? BY_ID.get(id) : undefined)
export const assetsFor = (slot: SlotId) => ASSETS.filter((a) => a.slot === slot)

export const DEFAULT_APPEARANCE: Appearance = {
  version: 1,
  skin: SKIN_TONES[1],
  hair: HAIR_COLORS[1],
  eyes: EYE_COLORS[0],
  parts: {
    body: { id: "body_average" },
    ears: { id: "ears_human" },
    face: { id: "face_soft" },
    eyes: { id: "eyes_soft" },
    eyebrows: { id: "brows_soft" },
    mouth: { id: "mouth_smile" },
    hair: { id: "hair_tousled" },
    top: { id: "top_shirt", colors: { primary: "#f2efe8", secondary: "#d9c3a0" } },
    bottom: { id: "bottom_trousers", colors: { primary: "#2f3440", secondary: "#16141c" } },
    shoes: { id: "shoes_ankle" },
  },
}

/** Swatches offered for one of an asset's colours. */
export function paletteFor(asset: Asset, key: ColorSlot) {
  return key === "trim" || (key === "primary" && asset.metal) ? METAL_COLORS : CLOTH_COLORS
}

function tokensFor(a: Appearance, part: Part | undefined, asset: Asset): Record<string, string> {
  const pick = (key: ColorSlot, fallback: string) =>
    part?.colors?.[key] ?? asset.colors?.[key] ?? fallback
  return {
    line: LINE,
    ...colorFamily("skin", a.skin),
    ...colorFamily("hair", a.hair),
    ...colorFamily("eyes", a.eyes),
    ...colorFamily("primary", pick("primary", "#6b3fa0")),
    ...colorFamily("secondary", pick("secondary", "#c9ccd6")),
    ...colorFamily("trim", pick("trim", "#d4af37")),
  }
}

/**
 * Stacks the chosen assets into one SVG document.
 *
 * The same function draws the editor preview, the thumbnails and the served
 * portraits, so what someone designs is exactly what everyone else sees.
 */
export function composeSvg(appearance: Appearance, viewBox: string = FULL_VIEW) {
  const layers = new Map<Layer, string>()

  for (const slot of SLOTS) {
    const part = appearance.parts[slot.id]
    const asset = getAsset(part?.id)
    if (!asset || asset.slot !== slot.id) continue

    const tokens = tokensFor(appearance, part, asset)
    for (const [layer, markup] of Object.entries(asset.layers) as [Layer, string][]) {
      const painted = markup.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? "none")
      layers.set(layer, (layers.get(layer) ?? "") + painted)
    }
  }

  const scale = getAsset(appearance.parts.body?.id)?.widthScale ?? 1
  const stretch = `matrix(${scale} 0 0 1 ${(CANVAS_WIDTH / 2) * (1 - scale)} 0)`

  let body = ""
  for (const layer of LAYERS) {
    const markup = layers.get(layer)
    if (!markup) continue
    body += scale !== 1 && BODY_LAYERS.has(layer) ? `<g transform="${stretch}">${markup}</g>` : markup
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const hexOr = (v: unknown, fallback: string) =>
  typeof v === "string" && HEX.test(v) ? v.toLowerCase() : fallback

/**
 * Turns anything (a stored value, a client payload) into a valid appearance.
 *
 * Only catalogue ids and #rrggbb colours survive, which is what makes the
 * composed SVG safe to serve: nothing a user typed ever reaches the markup.
 * Unknown or missing required parts fall back to the defaults.
 */
export function normalizeAppearance(raw: unknown): Appearance {
  const input = isRecord(raw) ? raw : {}
  const parts = isRecord(input.parts) ? input.parts : {}

  const out: Appearance = {
    version: 1,
    skin: hexOr(input.skin, DEFAULT_APPEARANCE.skin),
    hair: hexOr(input.hair, DEFAULT_APPEARANCE.hair),
    eyes: hexOr(input.eyes, DEFAULT_APPEARANCE.eyes),
    parts: {},
  }

  for (const slot of SLOTS) {
    const part = parts[slot.id]
    const asset = isRecord(part) && typeof part.id === "string" ? getAsset(part.id) : undefined

    if (asset && asset.slot === slot.id) {
      const colors: Partial<Record<ColorSlot, string>> = {}
      if (isRecord(part) && isRecord(part.colors)) {
        for (const key of COLOR_SLOTS) {
          const value = part.colors[key]
          if (asset.colors?.[key] && typeof value === "string" && HEX.test(value)) {
            colors[key] = value.toLowerCase()
          }
        }
      }
      out.parts[slot.id] = Object.keys(colors).length > 0 ? { id: asset.id, colors } : { id: asset.id }
    } else if (!slot.optional) {
      out.parts[slot.id] = { id: DEFAULT_APPEARANCE.parts[slot.id]!.id }
    }
  }

  // A dress replaces separates. Should both arrive, the dress wins.
  if (out.parts.dress) {
    delete out.parts.top
    delete out.parts.bottom
  }
  return out
}

/** Fills (or with `null`, empties) a slot, keeping its colours and clearing what it excludes. */
export function withPart(a: Appearance, slotId: SlotId, id: string | null): Appearance {
  const parts = { ...a.parts }
  if (id === null) {
    delete parts[slotId]
  } else {
    const colors = parts[slotId]?.colors
    parts[slotId] = colors ? { id, colors } : { id }
    for (const other of SLOTS.find((s) => s.id === slotId)?.excludes ?? []) delete parts[other]
  }
  return { ...a, parts }
}

export function withPartColor(a: Appearance, slotId: SlotId, key: ColorSlot, color: string): Appearance {
  const part = a.parts[slotId]
  if (!part) return a
  return { ...a, parts: { ...a.parts, [slotId]: { ...part, colors: { ...part.colors, [key]: color } } } }
}

/** How often an optional slot is filled when randomising. Unlisted ones always are. */
const RANDOM_CHANCE: Partial<Record<SlotId, number>> = {
  markings: 0.3,
  hair: 0.96,
  hairAccessory: 0.2,
  vest: 0.35,
  belt: 0.4,
  coat: 0.35,
  gloves: 0.2,
  shoes: 0.95,
  glasses: 0.12,
  mask: 0.06,
  earrings: 0.3,
  necklace: 0.3,
  bracelets: 0.2,
  hat: 0.22,
  weapon: 0.3,
  animalEars: 0.1,
  horns: 0.1,
  halo: 0.06,
  wings: 0.08,
  tail: 0.08,
}

/** A valid random look. Identity (name, bio) lives elsewhere and is untouched. */
export function randomAppearance(rand: () => number = Math.random): Appearance {
  const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
  const dress = rand() < 0.3

  const a: Appearance = {
    version: 1,
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_COLORS),
    eyes: pick(EYE_COLORS),
    parts: {},
  }

  for (const slot of SLOTS) {
    const skip =
      slot.id === "dress"
        ? !dress
        : slot.id === "top" || slot.id === "bottom"
          ? dress
          : // A vest over a gown is allowed, just rarely what anyone wants at random.
            (slot.id === "vest" && dress) || (slot.optional && rand() > (RANDOM_CHANCE[slot.id] ?? 1))
    if (skip) continue

    const asset = pick(assetsFor(slot.id))
    const colors: Partial<Record<ColorSlot, string>> = {}
    for (const key of COLOR_SLOTS) {
      if (asset.colors?.[key]) colors[key] = pick(paletteFor(asset, key))
    }
    a.parts[slot.id] = Object.keys(colors).length > 0 ? { id: asset.id, colors } : { id: asset.id }
  }
  return a
}
