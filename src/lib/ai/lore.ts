/**
 * Picks which lorebook entries an AI reply should see.
 *
 * An entry is activated when one of its keywords appears in the recent
 * conversation, or always if it is marked constant. Activated entries go in
 * constant first, then by priority, until the budget is spent. Pure, so it can
 * be tested on its own.
 */

export type LoreCandidate = {
  name: string
  keywords: string[]
  content: string
  constant: boolean
  enabled: boolean
  caseSensitive: boolean
  wholeWord: boolean
  priority: number
}

/** How many of the latest messages are scanned for keywords. */
export const LORE_SCAN_DEPTH = 6

/** Rough cap on lore in the prompt, in characters (about four per token). */
export const LORE_BUDGET = 8_000

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Whether a keyword occurs in the text, honouring the entry's matching rules. */
export function matchesKeyword(text: string, keyword: string, caseSensitive: boolean, wholeWord: boolean) {
  const kw = keyword.trim()
  if (!kw) return false
  // Letters and digits in any script count as "word", so whole-word matching
  // works for names like "Velmora" and for non-English text alike.
  const pattern = wholeWord ? `(?<![\\p{L}\\p{N}_])${escape(kw)}(?![\\p{L}\\p{N}_])` : escape(kw)
  return new RegExp(pattern, caseSensitive ? "u" : "iu").test(text)
}

export function activateLore<T extends LoreCandidate>(entries: T[], recentTexts: string[], budget = LORE_BUDGET): T[] {
  const haystack = recentTexts.join("\n")
  const active = entries.filter(
    (e) =>
      e.enabled &&
      e.content.trim() &&
      (e.constant || e.keywords.some((k) => matchesKeyword(haystack, k, e.caseSensitive, e.wholeWord)))
  )
  active.sort((a, b) => Number(b.constant) - Number(a.constant) || b.priority - a.priority)

  const chosen: T[] = []
  let left = budget
  for (const entry of active) {
    const cost = entry.name.length + entry.content.length
    if (cost > left) continue
    chosen.push(entry)
    left -= cost
  }
  return chosen
}

/** "Vermillion, the capital , vermillion" -> ["Vermillion", "the capital"]. */
export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(",")) {
    const kw = part.trim().slice(0, 60)
    if (!kw || seen.has(kw.toLowerCase())) continue
    seen.add(kw.toLowerCase())
    out.push(kw)
  }
  return out.slice(0, 30)
}
