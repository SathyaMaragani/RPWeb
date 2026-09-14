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
export const BUST_VIEW = "197 90 630 630"

/** Paint order, back to front. Every asset draws into one or more of these. */
export const LAYERS = [
  "back",
  "hairBack",
  "body",
  "legs",
  "feet",
  "torso",
  "vest",
  "waist",
  "outer",
  "gloves",
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
  "vest",
  "waist",
  "outer",
  "gloves",
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
  "Fantasy",
] as const
export type Category = (typeof CATEGORIES)[number]

export type SlotId =
  | "body"
  | "ears"
  | "face"
  | "markings"
  | "eyes"
  | "eyebrows"
  | "mouth"
  | "hair"
  | "hairAccessory"
  | "top"
  | "bottom"
  | "dress"
  | "vest"
  | "belt"
  | "coat"
  | "gloves"
  | "shoes"
  | "glasses"
  | "mask"
  | "earrings"
  | "necklace"
  | "bracelets"
  | "hat"
  | "weapon"
  | "animalEars"
  | "horns"
  | "halo"
  | "wings"
  | "tail"

export type SlotDef = {
  id: SlotId
  label: string
  category: Category
  /** Whether "None" is allowed. */
  optional: boolean
  /** Slots that are emptied when this one is filled: only real visual conflicts. */
  excludes?: SlotId[]
  /** The canvas region its thumbnails show. */
  view: string
}

/** In paint order within a layer, and in the order the editor lists them. */
export const SLOTS: SlotDef[] = [
  { id: "body", label: "Body type", category: "Body", optional: false, view: "180 110 664 1400" },
  { id: "ears", label: "Ears", category: "Body", optional: false, view: "150 220 400 400" },
  { id: "face", label: "Face shape", category: "Face", optional: false, view: "282 150 460 540" },
  { id: "markings", label: "Face details", category: "Face", optional: true, view: "352 330 320 300" },
  { id: "eyes", label: "Eyes", category: "Face", optional: false, view: "372 340 280 220" },
  { id: "eyebrows", label: "Eyebrows", category: "Face", optional: false, view: "372 300 280 220" },
  { id: "mouth", label: "Mouth", category: "Face", optional: false, view: "432 480 160 140" },
  { id: "hair", label: "Hairstyle", category: "Hair", optional: true, view: "150 30 724 1100" },
  { id: "hairAccessory", label: "Hair accessory", category: "Hair", optional: true, view: "180 110 664 440" },
  { id: "top", label: "Top", category: "Clothes", optional: true, excludes: ["dress"], view: "292 620 440 480" },
  { id: "bottom", label: "Bottom", category: "Clothes", optional: true, excludes: ["dress"], view: "292 930 440 580" },
  { id: "dress", label: "Dress", category: "Clothes", optional: true, excludes: ["top", "bottom"], view: "152 620 720 900" },
  { id: "vest", label: "Vest / armour", category: "Clothes", optional: true, view: "312 640 400 460" },
  { id: "belt", label: "Belt", category: "Clothes", optional: true, view: "312 880 400 300" },
  { id: "coat", label: "Coat / cloak", category: "Clothes", optional: true, view: "152 620 720 900" },
  { id: "gloves", label: "Gloves", category: "Clothes", optional: true, view: "292 880 440 240" },
  { id: "shoes", label: "Shoes", category: "Clothes", optional: true, view: "362 1190 300 320" },
  { id: "glasses", label: "Glasses", category: "Accessories", optional: true, view: "322 350 380 200" },
  { id: "mask", label: "Mask", category: "Accessories", optional: true, view: "292 330 440 340" },
  { id: "earrings", label: "Earrings", category: "Accessories", optional: true, view: "262 400 500 240" },
  { id: "necklace", label: "Necklace", category: "Accessories", optional: true, view: "362 580 300 360" },
  { id: "bracelets", label: "Bracelets", category: "Accessories", optional: true, view: "292 880 440 200" },
  { id: "hat", label: "Headwear", category: "Accessories", optional: true, view: "182 0 660 660" },
  { id: "weapon", label: "Weapon", category: "Weapons", optional: true, view: "440 360 560 1176" },
  { id: "animalEars", label: "Animal ears", category: "Fantasy", optional: true, view: "222 20 580 420" },
  { id: "horns", label: "Horns", category: "Fantasy", optional: true, view: "182 0 660 460" },
  { id: "halo", label: "Halo", category: "Fantasy", optional: true, view: "222 0 580 420" },
  { id: "wings", label: "Wings", category: "Fantasy", optional: true, view: "0 420 1024 1000" },
  { id: "tail", label: "Tail", category: "Fantasy", optional: true, view: "480 760 544 760" },
]

export type Asset = {
  id: string
  name: string
  slot: SlotId
  /**
   * Markup per layer, drawn on the 1024 × 1536 canvas in the standard pose.
   * Colours are written as {{tokens}}. The bases are skin, hair and eyes, and
   * for recolourable assets primary, secondary and trim; each also comes as
   * Shade, Deep, Light and Line variants (e.g. {{primaryShade}}).
   * Element ids must start with the slot name so no two assets collide.
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

export const SKIN_TONES = [
  "#fde7d6", "#f3c9a8", "#e0a882", "#c68660", "#9a6243", "#6b412c",
  "#e6e9f2", "#b9c7e6", "#a9c79c", "#c9b3e6",
]
export const HAIR_COLORS = [
  "#17141c", "#3b2a22", "#6f4a30", "#a8743f", "#e2c07a", "#f1ece2", "#b8b8c4",
  "#b3262e", "#e0584f", "#e58fb5", "#8e6ad6", "#3f63c4", "#2e8f83", "#6fae4d",
]
export const EYE_COLORS = [
  "#5a3b25", "#9a6a2f", "#2f6fb0", "#3f9a6a", "#8b95a5", "#d4a017", "#b0243a", "#8b5cf6", "#e8e8f0", "#e05d9a",
]
export const CLOTH_COLORS = [
  "#16141c", "#f2efe8", "#8f1d2c", "#c2334a", "#1f2f6b", "#3f6fd1", "#1f5e45",
  "#6b3fa0", "#c9a0dc", "#e7a6c0", "#6b4a32", "#d9c3a0", "#5b6472", "#2b7a8c",
]
export const METAL_COLORS = ["#d4af37", "#c9ccd6", "#b87333", "#2f3440", "#e8e4dc"]

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

/** The token variants every colour base gets. */
export function colorFamily(name: string, hex: string): Record<string, string> {
  return {
    [name]: hex,
    [`${name}Shade`]: shade(hex, -0.2),
    [`${name}Deep`]: shade(hex, -0.42),
    [`${name}Light`]: shade(hex, 0.32),
    [`${name}Line`]: shade(hex, -0.66),
  }
}

export const LINE = "#1f1726"

/** Outline attributes in a fixed dark ink, for small details. */
export const OUTLINE = `stroke="${LINE}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`

/** A stroke-only line. */
export const stroke = (d: string, width = 4, color = LINE, extra = "") =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`

/** A filled shape outlined in its own darker line colour. */
export const fillLine = (d: string, base: string, width = 4, extra = "") =>
  `<path d="${d}" fill="{{${base}}}" stroke="{{${base}Line}}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`

/** Draws `inner` only inside the shape `d`. */
export const clip = (id: string, d: string, inner: string) =>
  `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`

/**
 * A shaded shape: base colour, then shadows and highlights kept inside it, then
 * its outline on top so the edge stays crisp over the shading.
 */
export const shaded = (id: string, d: string, base: string, inner = "", width = 4) =>
  `<path d="${d}" fill="{{${base}}}"/>` +
  (inner ? clip(id, d, inner) : "") +
  `<path d="${d}" fill="none" stroke="{{${base}Line}}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`

/** A plain filled path in a token colour, for shadow and highlight shapes. */
export const tone = (d: string, color: string, extra = "") => `<path d="${d}" fill="{{${color}}}" ${extra}/>`

/**
 * The markup plus its mirror image across the centre line, for left/right
 * pairs. Ids in the mirrored copy get a suffix so they stay unique.
 */
export function sym(markup: string) {
  // Only ids defined inside the markup are renamed; references to shared
  // definitions elsewhere (a filter, say) must keep pointing at the original.
  let mirrored = markup
  for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) {
    mirrored = mirrored
      .split(`id="${id}"`)
      .join(`id="${id}-m"`)
      .split(`url(#${id})`)
      .join(`url(#${id}-m)`)
  }
  return `${markup}<g transform="matrix(-1 0 0 1 ${CANVAS_WIDTH} 0)">${mirrored}</g>`
}

/**
 * A tapered lock of hair from a base (a → b) to a tip, bowed sideways by
 * `sway`, with a strand line down its middle.
 */
export function lock(ax: number, ay: number, bx: number, by: number, tx: number, ty: number, sway = 0) {
  const d =
    `M${ax} ${ay} Q${(ax + tx) / 2 + sway} ${(ay + ty) / 2} ${tx} ${ty} ` +
    `Q${(bx + tx) / 2 + sway * 0.55} ${(by + ty) / 2} ${bx} ${by} Z`
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2
  const strand = `M${mx} ${my} Q${(mx + tx) / 2 + sway * 0.8} ${(my + ty) / 2} ${mx + (tx - mx) * 0.82} ${my + (ty - my) * 0.82}`
  return (
    `<path d="${d}" fill="{{hair}}" stroke="{{hairLine}}" stroke-width="3.5" stroke-linejoin="round"/>` +
    stroke(strand, 3, "{{hairShade}}")
  )
}
