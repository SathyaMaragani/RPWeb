/**
 * The layered character model: paint layers, slots, palettes, and the helpers
 * asset files are written with.
 *
 * A character's look is stored as a configuration (which asset fills each slot
 * and in what colours), never as a flattened picture, so the art can be redrawn
 * later without losing anyone's character. Relative imports only in this
 * folder, so it compiles on its own for checks.
 */

export const CANVAS_WIDTH = 1024
export const CANVAS_HEIGHT = 1536

/** The whole figure, and the square around head and shoulders used for avatars. */
export const FULL_VIEW = `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`
export const BUST_VIEW = "262 110 500 500"

/** Paint order, back to front. Every asset draws into one or more of these. */
export const LAYERS = [
  "back",
  "hairBack",
  "body",
  "legs",
  "feet",
  "torso",
  "outer",
  "neck",
  "head",
  "face",
  "ears",
  "eyewear",
  "hairFront",
  "horns",
  "headwear",
  "hand",
] as const
export type Layer = (typeof LAYERS)[number]

/** Layers stretched by the body type. The head, and what sits on it, keep their shape. */
export const BODY_LAYERS: ReadonlySet<Layer> = new Set([
  "back",
  "body",
  "legs",
  "feet",
  "torso",
  "outer",
  "neck",
  "hand",
])

export const COLOR_SLOTS = ["primary", "secondary", "trim"] as const
export type ColorSlot = (typeof COLOR_SLOTS)[number]

export const CATEGORIES = [
  "Body",
  "Face",
  "Hair",
  "Clothes",
  "Accessories",
  "Weapons",
  "Special",
] as const
export type Category = (typeof CATEGORIES)[number]

export type SlotId =
  | "body"
  | "face"
  | "eyes"
  | "eyebrows"
  | "mouth"
  | "hair"
  | "top"
  | "bottom"
  | "dress"
  | "coat"
  | "shoes"
  | "glasses"
  | "earrings"
  | "necklace"
  | "hat"
  | "weapon"
  | "wings"
  | "tail"
  | "horns"

export type SlotDef = {
  id: SlotId
  label: string
  category: Category
  /** Whether "None" is allowed. */
  optional: boolean
  /** Slots that are emptied when this one is filled. */
  excludes?: SlotId[]
  /** The canvas region its thumbnails show. */
  view: string
}

/** In paint order within a layer, and in the order the editor lists them. */
export const SLOTS: SlotDef[] = [
  { id: "body", label: "Body type", category: "Body", optional: false, view: "150 100 724 1400" },
  { id: "face", label: "Face shape", category: "Face", optional: false, view: "340 140 344 380" },
  { id: "eyes", label: "Eyes", category: "Face", optional: false, view: "400 270 224 140" },
  { id: "eyebrows", label: "Eyebrows", category: "Face", optional: false, view: "400 245 224 140" },
  { id: "mouth", label: "Mouth", category: "Face", optional: false, view: "432 370 160 120" },
  { id: "hair", label: "Hairstyle", category: "Hair", optional: true, view: "230 20 564 840" },
  { id: "top", label: "Top", category: "Clothes", optional: true, excludes: ["dress"], view: "220 470 584 640" },
  { id: "bottom", label: "Bottom", category: "Clothes", optional: true, excludes: ["dress"], view: "220 940 584 560" },
  { id: "dress", label: "Dress", category: "Clothes", optional: true, excludes: ["top", "bottom"], view: "120 470 784 1066" },
  { id: "coat", label: "Coat", category: "Clothes", optional: true, view: "140 470 744 940" },
  { id: "shoes", label: "Shoes", category: "Clothes", optional: true, view: "320 1150 384 360" },
  { id: "glasses", label: "Glasses", category: "Accessories", optional: true, view: "360 255 304 160" },
  { id: "earrings", label: "Earrings", category: "Accessories", optional: true, view: "330 290 364 170" },
  { id: "necklace", label: "Necklace", category: "Accessories", optional: true, view: "392 440 240 260" },
  { id: "hat", label: "Headwear", category: "Accessories", optional: true, view: "250 0 524 440" },
  { id: "weapon", label: "Weapon", category: "Weapons", optional: true, view: "560 440 380 1096" },
  { id: "wings", label: "Wings", category: "Special", optional: true, view: "0 150 1024 1150" },
  { id: "tail", label: "Tail", category: "Special", optional: true, view: "440 760 584 740" },
  { id: "horns", label: "Horns", category: "Special", optional: true, view: "300 20 424 360" },
]

export type Asset = {
  id: string
  name: string
  slot: SlotId
  /**
   * Markup per layer, drawn on the 1024 × 1536 canvas in the standard pose.
   * Colours are written as {{tokens}}: skin, skinShade, skinLight, lips, hair,
   * hairShade, hairLight, eyes, eyesShade, line, and for recolourable assets
   * primary / secondary / trim with their Shade and Light variants.
   */
  layers: Partial<Record<Layer, string>>
  /** The recolourable regions this asset has, with their starting colours. */
  colors?: Partial<Record<ColorSlot, string>>
  /** Offer metal swatches for the primary colour rather than fabric ones. */
  metal?: boolean
  /** Body types only: horizontal stretch applied to the body layers. */
  widthScale?: number
}

export type Part = { id: string; colors?: Partial<Record<ColorSlot, string>> }

export type Appearance = {
  version: 1
  skin: string
  hair: string
  eyes: string
  parts: Partial<Record<SlotId, Part>>
}

export const SKIN_TONES = ["#f6d7c3", "#eec1a0", "#d9a07b", "#b87952", "#8d5a3b", "#5c3a28"]
export const HAIR_COLORS = ["#1a1a1f", "#4a3222", "#8a5a33", "#d8b16a", "#b5452f", "#e8e4dc", "#7c5cff", "#2f8f83"]
export const EYE_COLORS = ["#4a3222", "#3a6ea5", "#3f8f5a", "#8a8f98", "#c9a227", "#8b5cf6", "#c23b3b", "#dfe3ee"]
export const CLOTH_COLORS = ["#18181b", "#f4f4f5", "#9f1239", "#1e3a8a", "#047857", "#6d28d9", "#7c2d12", "#64748b", "#db2777", "#0e7490"]
export const METAL_COLORS = ["#c9a227", "#c7c7d0", "#b87333", "#374151", "#e5e4e2"]

export const HEX = /^#[0-9a-f]{6}$/i

/** Lightens (amount > 0) or darkens (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  return (
    "#" +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  )
}

export const LINE = "#1b1524"

/** Outline attributes shared by every drawn shape. */
export const OUTLINE = `stroke="${LINE}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`

/** A stroke-only line in the outline colour. */
export const stroke = (d: string, width = 6, color = LINE) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

/** The markup plus its mirror image across the centre line, for left/right pairs. */
export function sym(markup: string) {
  return `${markup}<g transform="matrix(-1 0 0 1 ${CANVAS_WIDTH} 0)">${markup}</g>`
}
