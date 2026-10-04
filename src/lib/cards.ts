/**
 * Character cards in the Tavern format shared by SillyTavern, Chub, Janitor
 * and others: plain JSON (V1, V2 "chara_card_v2", V3 "chara_card_v3"), or the
 * same JSON hidden in a PNG's text chunk ("chara", or "ccv3" for V3).
 *
 * Pure and browser-safe: the import page parses in the browser for a preview,
 * and the server parses again before saving, because the browser is not trusted.
 */

/** Longest any single card field may be. Cards can be long; edits must still save. */
export const CARD_FIELD_MAX = 20_000
export const LORE_ENTRY_MAX = 6_000
export const LORE_ENTRIES_MAX = 200

export type CardLoreEntry = {
  name: string
  keywords: string[]
  content: string
  constant: boolean
  enabled: boolean
  caseSensitive: boolean
  wholeWord: boolean
  priority: number
}

export type ImportedCard = {
  name: string
  bio: string | null
  personality: string | null
  scenario: string | null
  greeting: string | null
  exampleDialogue: string | null
  tags: string[]
  lorebook: CardLoreEntry[]
  /** What could not be carried over, to tell the person importing. */
  warnings: string[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const str = (v: unknown) => (typeof v === "string" ? v : "")

/** Reads a card object of any supported version. Throws if it is not a card. */
export function parseCard(raw: unknown): ImportedCard {
  if (!isRecord(raw)) throw new Error("That file isn't a character card.")
  // V2 and V3 keep everything under `data`; V1 is flat.
  const d = (raw.spec === "chara_card_v2" || raw.spec === "chara_card_v3") && isRecord(raw.data) ? raw.data : raw
  const warnings: string[] = []

  const field = (key: string, label: string) => {
    const value = str(d[key]).trim()
    if (!value) return null
    if (value.length > CARD_FIELD_MAX) {
      warnings.push(`${label} was cut to ${CARD_FIELD_MAX.toLocaleString()} characters.`)
      return value.slice(0, CARD_FIELD_MAX)
    }
    return value
  }

  const name = str(d.name).trim().slice(0, 80)
  if (!name) throw new Error("The card has no character name.")

  const tags = (Array.isArray(d.tags) ? d.tags : [])
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim().slice(0, 32))
    .filter((t, i, all) => all.findIndex((o) => o.toLowerCase() === t.toLowerCase()) === i)
    .slice(0, 20)

  const alternates = Array.isArray(d.alternate_greetings) ? d.alternate_greetings.filter((g) => str(g).trim()).length : 0
  if (alternates) warnings.push(`${alternates} alternate first message${alternates === 1 ? "" : "s"} not imported.`)
  if (str(d.system_prompt).trim()) warnings.push("The card's system prompt was not imported; set world instructions instead.")
  if (str(d.post_history_instructions).trim()) warnings.push("Post-history instructions were not imported.")

  return {
    name,
    bio: field("description", "Description"),
    personality: field("personality", "Personality"),
    scenario: field("scenario", "Scenario"),
    greeting: field("first_mes", "First message"),
    exampleDialogue: field("mes_example", "Example dialogue"),
    tags,
    lorebook: parseBook(d.character_book, warnings),
    warnings,
  }
}

function parseBook(book: unknown, warnings: string[]): CardLoreEntry[] {
  if (!isRecord(book) || !Array.isArray(book.entries)) return []
  const out: CardLoreEntry[] = []
  for (const e of book.entries) {
    if (!isRecord(e)) continue
    const content = str(e.content).trim()
    const keywords = (Array.isArray(e.keys) ? e.keys : [])
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim().slice(0, 60))
      .slice(0, 30)
    const constant = e.constant === true
    if (!content || (!constant && keywords.length === 0)) continue
    if (out.length >= LORE_ENTRIES_MAX) {
      warnings.push(`Only the first ${LORE_ENTRIES_MAX} lorebook entries were imported.`)
      break
    }
    out.push({
      name: (str(e.name).trim() || str(e.comment).trim() || keywords[0] || "Entry").slice(0, 80),
      keywords,
      content: content.slice(0, LORE_ENTRY_MAX),
      constant,
      enabled: e.enabled !== false,
      caseSensitive: e.case_sensitive === true,
      wholeWord: true,
      // Tavern priority is "higher goes in first", like ours; fall back to
      // insertion_order, which the same tools treat the same way.
      priority: clampInt(typeof e.priority === "number" ? e.priority : Number(e.insertion_order) || 0),
    })
  }
  return out
}

const clampInt = (n: number) => Math.max(-100, Math.min(100, Math.round(n)))

/** Re-reads stored character lore defensively; anything malformed is dropped. */
export function normalizeLorebook(raw: unknown): CardLoreEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((e) =>
    isRecord(e) && typeof e.content === "string" && Array.isArray(e.keywords)
      ? [
          {
            name: str(e.name).slice(0, 80) || "Entry",
            keywords: e.keywords.filter((k): k is string => typeof k === "string").slice(0, 30),
            content: e.content.slice(0, LORE_ENTRY_MAX),
            constant: e.constant === true,
            enabled: e.enabled !== false,
            caseSensitive: e.caseSensitive === true,
            wholeWord: e.wholeWord !== false,
            priority: clampInt(Number(e.priority) || 0),
          },
        ]
      : []
  )
}

/** A character as a V2 card, the version every tool reads. */
export function toCardV2(c: {
  name: string
  bio?: string | null
  personality?: string | null
  scenario?: string | null
  greeting?: string | null
  exampleDialogue?: string | null
  tags?: string[]
  lorebook?: CardLoreEntry[]
}) {
  const book = c.lorebook ?? []
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: c.name,
      description: c.bio ?? "",
      personality: c.personality ?? "",
      scenario: c.scenario ?? "",
      first_mes: c.greeting ?? "",
      mes_example: c.exampleDialogue ?? "",
      creator_notes: "",
      system_prompt: "",
      post_history_instructions: "",
      alternate_greetings: [],
      tags: c.tags ?? [],
      creator: "",
      character_version: "",
      extensions: {},
      ...(book.length
        ? {
            character_book: {
              name: `${c.name} lore`,
              extensions: {},
              entries: book.map((e, i) => ({
                id: i + 1,
                name: e.name,
                keys: e.keywords,
                content: e.content,
                enabled: e.enabled,
                constant: e.constant,
                case_sensitive: e.caseSensitive,
                priority: e.priority,
                insertion_order: e.priority,
                extensions: {},
              })),
            },
          }
        : {}),
    },
  }
}

// ------------------------------------------------------------------ PNG text chunks

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

function isPng(bytes: Uint8Array) {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b)
}

/** The keyword/text pairs from a PNG's tEXt chunks. */
export function readPngText(bytes: Uint8Array): Record<string, string> {
  if (!isPng(bytes)) throw new Error("That file isn't a PNG image.")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const out: Record<string, string> = {}
  let at = 8
  while (at + 12 <= bytes.length) {
    const length = view.getUint32(at)
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8))
    const data = bytes.subarray(at + 8, at + 8 + length)
    if (type === "tEXt") {
      const zero = data.indexOf(0)
      if (zero > 0) out[latin1(data.subarray(0, zero))] = latin1(data.subarray(zero + 1))
    }
    if (type === "IEND") break
    at += 12 + length
  }
  return out
}

/** The card JSON inside a PNG card, preferring the V3 chunk when both exist. */
export function cardFromPng(bytes: Uint8Array): unknown {
  const text = readPngText(bytes)
  const encoded = text.ccv3 ?? text.chara
  if (!encoded) throw new Error("This PNG has no character card inside it.")
  try {
    return JSON.parse(utf8FromBase64(encoded))
  } catch {
    throw new Error("The card inside this PNG is damaged.")
  }
}

/** A copy of the PNG with `text` stored under `keyword`, replacing any card already in it. */
export function writePngText(bytes: Uint8Array, keyword: string, text: string): Uint8Array {
  if (!isPng(bytes)) throw new Error("Not a PNG image.")
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const kept: Uint8Array[] = [bytes.subarray(0, 8)]
  let at = 8
  let iend: Uint8Array | null = null
  while (at + 12 <= bytes.length) {
    const length = view.getUint32(at)
    const chunk = bytes.subarray(at, at + 12 + length)
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8))
    if (type === "IEND") {
      iend = chunk
      break
    }
    const isOldCard = type === "tEXt" && ["chara", "ccv3"].includes(latin1(chunk.subarray(8, 8 + Math.max(0, chunk.indexOf(0, 8) - 8))))
    if (!isOldCard) kept.push(chunk)
    at += 12 + length
  }
  if (!iend) throw new Error("Damaged PNG.")

  const data = new Uint8Array([...ascii(keyword), 0, ...ascii(text)])
  const chunk = new Uint8Array(12 + data.length)
  const out = new DataView(chunk.buffer)
  out.setUint32(0, data.length)
  chunk.set(ascii("tEXt"), 4)
  chunk.set(data, 8)
  out.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))

  const parts = [...kept, chunk, iend]
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

/** The card as the base64 text a PNG card stores. */
export const cardToPngText = (card: unknown) => base64FromUtf8(JSON.stringify(card))

const latin1 = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join("")
const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)

function utf8FromBase64(b64: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0)))
}

function base64FromUtf8(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

let crcTable: Uint32Array | null = null
function crc32(bytes: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
