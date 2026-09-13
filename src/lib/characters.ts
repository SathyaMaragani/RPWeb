/** Colour handling for characters, shared by the forms and the chat. */

/** Offered as swatches. Chosen to stay legible on the dark canvas. */
export const CHARACTER_COLORS = [
  "#7dd3fc", // sky
  "#6ee7b7", // emerald
  "#a78bfa", // violet
  "#fca5a5", // rose
  "#fcd34d", // amber
  "#f9a8d4", // pink
  "#5eead4", // teal
  "#c4b5fd", // lavender
  "#fdba74", // orange
  "#93c5fd", // blue
] as const

const HEX = /^#[0-9a-f]{6}$/i

/** Accepts `#rrggbb` (any case) and rejects anything else, including empty. */
export function normalizeColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (!HEX.test(trimmed)) throw new Error("Colour must be a hex value like #7dd3fc")
  return trimmed.toLowerCase()
}

/** A stable hue per id, used when a character has no colour of its own. */
export function fallbackColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 66%)`
}

export function characterColor(character: { id: string; color?: string | null }) {
  return character.color ?? fallbackColor(character.id)
}

/**
 * Uploaded avatars are stored square at this size, in WebP. Large enough for
 * the character gallery's portraits and view dialog on a high-density screen.
 */
export const AVATAR_SIZE = 768

/** Refuse anything larger than a cropped 768px WebP could plausibly be. */
export const MAX_AVATAR_BYTES = 1_500_000

/** Banners are stored at this width, three times as wide as they are tall. */
export const BANNER_WIDTH = 768
export const BANNER_ASPECT = 3
export const MAX_BANNER_BYTES = 1_200_000

export const ALLOWED_AVATAR_MIME = ["image/webp", "image/jpeg", "image/png"] as const

/**
 * Where to load a character's picture from.
 *
 * An uploaded avatar is served by its own route rather than inlined, because
 * this value is embedded in every message payload — a data URI here would be
 * repeated for each message on screen. The route sends immutable cache headers,
 * so `v` changes whenever the image does.
 */
export function avatarSrc(character: {
  id: string
  avatarUrl?: string | null
  avatarUpdatedAt?: Date | string | null
  appearanceUpdatedAt?: Date | string | null
}): string | null {
  const uploaded = character.avatarUpdatedAt ? new Date(character.avatarUpdatedAt).getTime() : 0
  const designed = character.appearanceUpdatedAt
    ? new Date(character.appearanceUpdatedAt).getTime()
    : 0

  // Whichever was set last is the face they chose: uploading a picture
  // replaces a designed look, and saving a design again brings it back.
  if (designed && designed >= uploaded) {
    return `/api/characters/${character.id}/portrait?v=${designed}`
  }
  if (uploaded) return `/api/characters/${character.id}/avatar?v=${uploaded}`
  return character.avatarUrl ?? null
}

/** The full-length designed figure, or null when they have never been designed. */
export function portraitSrc(character: {
  id: string
  appearanceUpdatedAt?: Date | string | null
}): string | null {
  if (!character.appearanceUpdatedAt) return null
  const version = new Date(character.appearanceUpdatedAt).getTime()
  return `/api/characters/${character.id}/portrait?view=full&v=${version}`
}

/** Splits a `data:` URL into its mime type and bytes. */
export function parseDataUrl(
  dataUrl: string,
  maxBytes: number = MAX_AVATAR_BYTES
): { mime: string; bytes: Buffer } {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim())
  if (!match) throw new Error("Image is not a valid data URL")

  const mime = match[1].toLowerCase()
  if (!(ALLOWED_AVATAR_MIME as readonly string[]).includes(mime)) {
    throw new Error("Image must be WebP, JPEG or PNG")
  }

  const bytes = Buffer.from(match[2], "base64")
  if (bytes.length === 0) throw new Error("Image is empty")
  if (bytes.length > maxBytes) {
    throw new Error(`Image is too large (max ${Math.round(maxBytes / 1000)} KB)`)
  }
  return { mime, bytes }
}

/** Where to load a world's banner from, mirroring how avatars resolve. */
export function bannerSrc(world: {
  id: string
  bannerUrl?: string | null
  bannerUpdatedAt?: Date | string | null
}): string | null {
  if (world.bannerUpdatedAt) {
    return `/api/worlds/${world.id}/banner?v=${new Date(world.bannerUpdatedAt).getTime()}`
  }
  return world.bannerUrl ?? null
}
