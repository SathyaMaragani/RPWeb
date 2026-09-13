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
  shade,
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

export * from "./core"

/** Every asset. Adding an item is a new entry in one of the asset files. */
export const ASSETS: Asset[] = [...BODY_ASSETS, ...HAIR_ASSETS, ...CLOTHING_ASSETS, ...EXTRA_ASSETS]

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
    face: { id: "face_oval" },
    eyes: { id: "eyes_round" },
    eyebrows: { id: "brows_arched" },
    mouth: { id: "mouth_smile" },
    hair: { id: "hair_side_part" },
    top: { id: "top_tshirt" },
    bottom: { id: "bottom_trousers" },
    shoes: { id: "shoes_boots" },
  },
}

/** Swatches offered for one of an asset's colours. */
export function paletteFor(asset: Asset, key: ColorSlot) {
  return key === "trim" || (key === "primary" && asset.metal) ? METAL_COLORS : CLOTH_COLORS
}

function tokensFor(a: Appearance, part: Part | undefined, asset: Asset): Record<string, string> {
  const pick = (key: ColorSlot, fallback: string) =>
    part?.colors?.[key] ?? asset.colors?.[key] ?? fallback
  const primary = pick("primary", "#6d28d9")
  const secondary = pick("secondary", "#c7c7d0")
  const trim = pick("trim", "#c9a227")
  return {
    line: LINE,
    skin: a.skin,
    skinShade: shade(a.skin, -0.18),
    skinLight: shade(a.skin, 0.25),
    lips: shade(a.skin, -0.35),
    hair: a.hair,
    hairShade: shade(a.hair, -0.3),
    hairLight: shade(a.hair, 0.3),
    eyes: a.eyes,
    eyesShade: shade(a.eyes, -0.35),
    primary,
    primaryShade: shade(primary, -0.25),
    primaryLight: shade(primary, 0.2),
    secondary,
    secondaryShade: shade(secondary, -0.25),
    trim,
    trimShade: shade(trim, -0.25),
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
  hair: 0.92,
  coat: 0.35,
  shoes: 0.9,
  glasses: 0.2,
  earrings: 0.3,
  necklace: 0.3,
  hat: 0.25,
  weapon: 0.3,
  wings: 0.12,
  tail: 0.12,
  horns: 0.12,
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
          : slot.optional && rand() > (RANDOM_CHANCE[slot.id] ?? 1)
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
