"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId, requireWorldMembership } from "@/server/auth-guards"
import { addSwipe, serializeMessage, MAX_MESSAGE_LENGTH, type SerializedMessage } from "@/lib/messages"
import { buildPrompt, buildSummaryPrompt, cleanReply, fillVariables, fitHistory, SUMMARY_MAX } from "@/lib/ai/prompt"
import { activateLore, LORE_SCAN_DEPTH } from "@/lib/ai/lore"
import { normalizeLorebook } from "@/lib/cards"
import { isProviderId, PROVIDERS } from "@/lib/ai/providers"
import { estimateTokens } from "@/lib/characters"
import { decryptSecret } from "@/server/ai/crypto"
import { generateText, GenerationError, type GenerateRequest } from "@/server/ai/generate"

/**
 * How many recent messages are fetched before the token budget trims them.
 * Generous, so a preset with a large context size actually gets to use it.
 */
const HISTORY_LIMIT = 300

type ReplyResult = { ok: true; message: SerializedMessage } | { ok: false; error: string }
type ReplyOptions = { personaId?: string | null; regenerateMessageId?: string | null }

/**
 * Gathers everything a reply needs: membership, the character and world,
 * the requester's default model, persona, history and activated lore.
 * Shared by real replies and the prompt preview, so the preview shows exactly
 * what a reply would send.
 */
async function prepareReply(userId: string, worldId: string, characterId: string, options: ReplyOptions) {
  const [member, castEntry, world, preset, persona, recent] = await Promise.all([
    prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId, userId } },
      include: { character: true },
    }),
    prisma.worldCharacter.findUnique({
      where: { worldId_characterId: { worldId, characterId } },
      include: { character: true },
    }),
    prisma.world.findUnique({
      where: { id: worldId },
      select: {
        name: true,
        description: true,
        memory: true,
        systemPrompt: true,
        postHistory: true,
        summary: true,
        summaryUntil: true,
        cast: { select: { character: { select: { id: true, name: true, title: true, bio: true } } } },
        lore: { where: { enabled: true } },
      },
    }),
    prisma.modelPreset.findFirst({ where: { userId, isDefault: true } }),
    // Omitted means "my default persona"; an empty string means "none, just
    // my character in this world".
    options.personaId === undefined
      ? prisma.persona.findFirst({ where: { userId, isDefault: true } })
      : options.personaId
        ? prisma.persona.findFirst({ where: { id: options.personaId, userId } })
        : null,
    prisma.message.findMany({
      where: { worldId, deletedAt: null },
      orderBy: { timestamp: "desc" },
      take: HISTORY_LIMIT,
      include: { character: { select: { name: true } } },
    }),
  ])

  if (!member || !world) return { error: "You're not a member of this world." } as const
  if (!castEntry?.aiEnabled) return { error: "That character isn't AI-played in this world." } as const
  if (!preset || !isProviderId(preset.provider)) {
    return { error: "Add an AI model in Settings first: choose a provider and paste your API key." } as const
  }

  let history = recent.reverse()
  let regenerating: (typeof history)[number] | null = null
  if (options.regenerateMessageId) {
    const last = history.at(-1)
    if (!last || last.id !== options.regenerateMessageId || !last.aiGenerated) {
      return { error: "Only the latest AI reply can be regenerated." } as const
    }
    regenerating = last
    history = history.slice(0, -1)
  }

  const character = castEntry.character
  // Keywords are looked for in the latest few messages, so lore comes and goes
  // with what the scene is actually about. The world's lorebook plus any lore
  // the character carries from its card.
  const lore = activateLore(
    [...world.lore, ...normalizeLorebook(character.lorebook)],
    history.slice(-LORE_SCAN_DEPTH).map((m) => m.content)
  )
  const turns = history.map((m) => ({ characterId: m.characterId, characterName: m.character.name, content: m.content }))
  const historyBudget = preset.contextTokens * 4

  return {
    preset: { ...preset, provider: preset.provider },
    world,
    history,
    regenerating,
    historyBudget,
    /** Builds the prompt with a given summary (fresh for replies, stored for previews). */
    build: (summary: string | null) =>
      buildPrompt({
        character,
        others: world.cast.map((c) => c.character).filter((c) => c.id !== character.id),
        userName: persona?.name ?? member.character.name,
        personaDescription: persona?.description,
        world,
        summary,
        lore,
        history: turns,
        historyBudget,
      }),
    turns,
    character,
  }
}

/**
 * Writes the next message as an AI-played character, using the requester's
 * default model preset and their own API key.
 *
 * Returns errors instead of throwing them: Next.js hides thrown messages in
 * production, and "your key was rejected" is something the user needs to see.
 *
 * With `regenerateMessageId`, adds a new version of that message instead. Only
 * the latest message in the world can be regenerated, and only if a model wrote it.
 */
export async function generateReply(
  worldId: string,
  characterId: string,
  options: ReplyOptions = {}
): Promise<ReplyResult> {
  const userId = await requireUserId()
  const ctx = await prepareReply(userId, worldId, characterId, options)
  if ("error" in ctx) return { ok: false, error: ctx.error as string }

  const { preset } = ctx
  const model = {
    provider: preset.provider,
    baseUrl: preset.baseUrl,
    model: preset.model,
    apiKey: decryptSecret(preset.apiKeyEnc),
    temperature: preset.temperature,
    topP: preset.topP,
    maxTokens: preset.maxTokens,
  }

  // Whatever no longer fits in the prompt is folded into the rolling summary
  // first, so a long story is not forgotten from the beginning.
  const windowStart = ctx.history.at(-fitHistory(ctx.turns, ctx.historyBudget))?.timestamp
  const summary = windowStart ? await refreshSummary(worldId, ctx.world, windowStart, model) : ctx.world.summary

  let text: string
  try {
    text = await generateText({ ...model, ...ctx.build(summary) })
  } catch (error) {
    if (error instanceof GenerationError) return { ok: false, error: error.message }
    console.error("AI generation failed", error)
    return { ok: false, error: "Something went wrong while generating the reply." }
  }

  const content = cleanReply(text, ctx.character.name).slice(0, MAX_MESSAGE_LENGTH)
  // A regenerated reply keeps its earlier versions to swipe back to.
  const message = ctx.regenerating
    ? await prisma.message.update({
        where: { id: ctx.regenerating.id },
        data: addSwipe(ctx.regenerating, content),
        include: { character: true },
      })
    : await prisma.message.create({
        data: { worldId, characterId, authorId: userId, content, format: "MIXED", aiGenerated: true },
        include: { character: true },
      })

  return { ok: true, message: serializeMessage(message) }
}

export type PromptPreview =
  | {
      ok: true
      model: string
      sections: { title: string; tokens: number }[]
      historyMessages: number
      totalTokens: number
      system: string
      messages: { role: string; content: string }[]
    }
  | { ok: false; error: string }

/**
 * What the next reply for a character would send, without calling the model:
 * the full prompt and roughly how many tokens each part uses. Uses the stored
 * summary, so previewing never spends anything.
 */
export async function previewPrompt(
  worldId: string,
  characterId: string,
  personaId?: string | null
): Promise<PromptPreview> {
  const userId = await requireUserId()
  const ctx = await prepareReply(userId, worldId, characterId, { personaId })
  if ("error" in ctx) return { ok: false, error: ctx.error as string }

  const prompt = ctx.build(ctx.world.summary)
  const [instructions, ...rest] = prompt.system.split("\n\n## ")
  const sections = [
    { title: "Instructions", tokens: estimateTokens(instructions) },
    ...rest.map((part) => ({ title: part.split("\n")[0], tokens: estimateTokens(part) })),
  ]
  const history = prompt.messages.slice(0, -1)
  sections.push({ title: `Chat history (${history.length} messages)`, tokens: estimateTokens(history.map((m) => m.content).join("\n")) })
  sections.push({ title: "Request for the reply", tokens: estimateTokens(prompt.messages.at(-1)!.content) })

  return {
    ok: true,
    model: `${PROVIDERS[ctx.preset.provider].label} · ${ctx.preset.model}`,
    sections,
    historyMessages: history.length,
    totalTokens: sections.reduce((n, s) => n + s.tokens, 0),
    system: prompt.system,
    messages: prompt.messages,
  }
}

/** Unsummarised older text needed before a summary is worth a model call. */
const SUMMARY_TRIGGER = 2_000
/** Most older text folded in per reply; a long backlog catches up over several. */
const SUMMARY_CHUNK = 40_000

/**
 * Folds messages that have dropped out of the prompt window into the world's
 * running summary, and returns the summary to use. Never fails the reply: if
 * summarising goes wrong, the old summary is used and it is tried next time.
 */
async function refreshSummary(
  worldId: string,
  world: { summary: string | null; summaryUntil: Date | null },
  windowStart: Date,
  model: Omit<GenerateRequest, "system" | "messages">
) {
  const pending = await prisma.message.findMany({
    where: {
      worldId,
      deletedAt: null,
      timestamp: { lt: windowStart, ...(world.summaryUntil ? { gt: world.summaryUntil } : {}) },
    },
    orderBy: { timestamp: "asc" },
    take: 300,
    include: { character: { select: { name: true } } },
  })

  const chunk: typeof pending = []
  let chars = 0
  for (const m of pending) {
    if (chunk.length && chars + m.content.length > SUMMARY_CHUNK) break
    chunk.push(m)
    chars += m.content.length
  }
  // ponytail: a few short dropped lines wait until enough pile up, so the AI
  // can briefly miss them; lower SUMMARY_TRIGGER if that ever shows.
  if (chars < SUMMARY_TRIGGER) return world.summary

  try {
    const text = await generateText({
      ...model,
      temperature: Math.min(model.temperature, 0.7),
      ...buildSummaryPrompt(
        world.summary,
        chunk.map((m) => ({ characterName: m.character.name, content: m.content }))
      ),
    })
    const summary = text.trim().slice(0, SUMMARY_MAX)
    await prisma.world.update({
      where: { id: worldId },
      data: { summary, summaryUntil: chunk.at(-1)!.timestamp },
    })
    return summary
  } catch (error) {
    console.error("Summary update failed", error)
    return world.summary
  }
}

/**
 * Turns AI play on or off for a cast member. Turning it on in a world with no
 * messages yet posts the character's first message, if they have one.
 */
export async function setCharacterAi(worldId: string, characterId: string, enabled: boolean) {
  const userId = await requireUserId()
  const member = await requireWorldMembership(userId, worldId)

  const entry = await prisma.worldCharacter.update({
    where: { worldId_characterId: { worldId, characterId } },
    data: { aiEnabled: enabled },
    include: { character: true },
  })

  if (enabled && entry.character.greeting) {
    const [count, persona, own] = await Promise.all([
      prisma.message.count({ where: { worldId, deletedAt: null } }),
      prisma.persona.findFirst({ where: { userId, isDefault: true }, select: { name: true } }),
      prisma.character.findUnique({ where: { id: member.characterId }, select: { name: true } }),
    ])
    if (count === 0) {
      const userName = persona?.name ?? own?.name ?? "you"
      await prisma.message.create({
        data: {
          worldId,
          characterId,
          authorId: userId,
          content: fillVariables(entry.character.greeting, entry.character.name, userName).slice(0, MAX_MESSAGE_LENGTH),
          format: "MIXED",
          aiGenerated: true,
        },
      })
    }
  }
  revalidatePath(`/worlds/${worldId}`)
}

/** The world's memory notes and custom AI instructions. Any member may edit them. */
export async function updateWorldAi(worldId: string, formData: FormData) {
  const userId = await requireUserId()
  await requireWorldMembership(userId, worldId)
  const memory = (formData.get("memory") as string | null)?.trim() || null
  const systemPrompt = (formData.get("systemPrompt") as string | null)?.trim() || null
  const summary = (formData.get("summary") as string | null)?.trim() || null
  const postHistory = (formData.get("postHistory") as string | null)?.trim() || null
  if (
    (memory?.length ?? 0) > 8000 ||
    (systemPrompt?.length ?? 0) > 8000 ||
    (postHistory?.length ?? 0) > 2000 ||
    (summary?.length ?? 0) > SUMMARY_MAX
  ) {
    throw new Error("Keep memory and instructions under 8,000 characters each, and the summary under 6,000")
  }
  // Clearing the summary starts it again from the first message.
  await prisma.world.update({
    where: { id: worldId },
    data: { memory, systemPrompt, postHistory, summary, ...(summary ? {} : { summaryUntil: null }) },
  })
  revalidatePath(`/worlds/${worldId}`)
}
