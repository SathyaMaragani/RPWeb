/**
 * Builds what an AI character is given: instructions, the card, the world,
 * who it is talking to, memory, then as much recent history as fits.
 *
 * Pure (no database), so it can be tested on its own.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string }

export type PromptCharacter = {
  id: string
  name: string
  title?: string | null
  bio?: string | null
  personality?: string | null
  scenario?: string | null
  exampleDialogue?: string | null
}

export type PromptInput = {
  character: PromptCharacter
  /** Everyone else in the cast, for a line each. */
  others: { name: string; title?: string | null; bio?: string | null }[]
  /** Who the AI is writing to: the persona's name, or the person's own character. */
  userName: string
  personaDescription?: string | null
  world: { name: string; description?: string | null; memory?: string | null; systemPrompt?: string | null }
  /** Lorebook entries already activated for this reply. */
  lore?: { name: string; content: string }[]
  /** Oldest first. */
  history: { characterId: string; characterName: string; content: string }[]
  /** Rough budget for history, in characters (about four per token). */
  historyBudget?: number
}

export const DEFAULT_SYSTEM_PROMPT =
  "You are {{char}} in an ongoing collaborative roleplay with {{user}}. Write only {{char}}'s next reply: " +
  "stay in character, never write {{user}}'s words, actions or thoughts, and keep the story moving. " +
  'Put actions in *asterisks*, spoken words in "quotes" and inner thoughts in **double asterisks**. ' +
  "Write one to three paragraphs, and don't start with your own name."

/** Expands {{char}} and {{user}}, in any letter case. */
export function fillVariables(text: string, char: string, user: string) {
  return text.replace(/\{\{\s*char\s*\}\}/gi, char).replace(/\{\{\s*user\s*\}\}/gi, user)
}

const section = (title: string, body: string | null | undefined) =>
  body?.trim() ? `## ${title}\n${body.trim()}` : ""

export function buildPrompt(input: PromptInput): { system: string; messages: ChatTurn[] } {
  const { character: c, userName } = input
  const fill = (text: string | null | undefined) => (text ? fillVariables(text, c.name, userName) : text)

  const system = [
    fill(input.world.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT),
    section(
      c.name,
      [c.title, c.bio, c.personality && `Personality: ${c.personality}`].filter(Boolean).map(fill).join("\n")
    ),
    section("Scenario", fill(c.scenario)),
    section(`The world: ${input.world.name}`, input.world.description),
    section(`${userName} (who you are writing to)`, fill(input.personaDescription)),
    section(
      "Other characters",
      input.others
        .map((o) => `- ${o.name}${o.title ? `, ${o.title}` : ""}${o.bio ? `: ${o.bio.slice(0, 300)}` : ""}`)
        .join("\n")
    ),
    section(
      "World lore (relevant right now)",
      input.lore?.map((l) => `### ${l.name}\n${fill(l.content)}`).join("\n\n")
    ),
    section("Memory (keep these facts consistent)", fill(input.world.memory)),
    section("Example dialogue (style reference only)", fill(c.exampleDialogue)),
  ]
    .filter(Boolean)
    .join("\n\n")

  // Newest backwards until the budget runs out, then back into order.
  let budget = input.historyBudget ?? 24_000
  const recent: ChatTurn[] = []
  for (const m of [...input.history].reverse()) {
    const turn: ChatTurn =
      m.characterId === c.id
        ? { role: "assistant", content: m.content }
        : { role: "user", content: `${m.characterName}: ${m.content}` }
    budget -= turn.content.length
    if (budget < 0 && recent.length > 0) break
    recent.unshift(turn)
  }

  // Always end on a user turn: current models refuse a trailing assistant
  // message (prefill), and it says plainly what is wanted.
  return { system, messages: [...recent, { role: "user", content: `[Write ${c.name}'s next reply.]` }] }
}

/** Removes a leading "Name:" some models add despite being told not to. */
export function cleanReply(text: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(new RegExp(`^\\s*\\**${escaped}\\**\\s*:\\s*`, "i"), "").trim()
}
