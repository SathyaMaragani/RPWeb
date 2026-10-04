"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId, requireWorldMembership } from "@/server/auth-guards"
import { serializeMessage, MAX_MESSAGE_LENGTH, type SerializedMessage } from "@/lib/messages"
import { buildPrompt, cleanReply, fillVariables } from "@/lib/ai/prompt"
import { activateLore, LORE_SCAN_DEPTH } from "@/lib/ai/lore"
import { normalizeLorebook } from "@/lib/cards"
import { isProviderId } from "@/lib/ai/providers"
import { decryptSecret } from "@/server/ai/crypto"
import { generateText, GenerationError } from "@/server/ai/generate"

/** How many recent messages are considered before the token budget trims them. */
const HISTORY_LIMIT = 80

type ReplyResult = { ok: true; message: SerializedMessage } | { ok: false; error: string }

/**
 * Writes the next message as an AI-played character, using the requester's
 * default model preset and their own API key.
 *
 * Returns errors instead of throwing them: Next.js hides thrown messages in
 * production, and "your key was rejected" is something the user needs to see.
 *
 * With `regenerateMessageId`, rewrites that message instead. Only the latest
 * message in the world can be regenerated, and only if a model wrote it.
 */
export async function generateReply(
  worldId: string,
  characterId: string,
  options: { personaId?: string | null; regenerateMessageId?: string | null } = {}
): Promise<ReplyResult> {
  const userId = await requireUserId()

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

  if (!member || !world) return { ok: false, error: "You're not a member of this world." }
  if (!castEntry?.aiEnabled) return { ok: false, error: "That character isn't AI-played in this world." }
  if (!preset || !isProviderId(preset.provider)) {
    return { ok: false, error: "Add an AI model in Settings first: choose a provider and paste your API key." }
  }

  let history = recent.reverse()
  if (options.regenerateMessageId) {
    const last = history.at(-1)
    if (!last || last.id !== options.regenerateMessageId || !last.aiGenerated) {
      return { ok: false, error: "Only the latest AI reply can be regenerated." }
    }
    history = history.slice(0, -1)
  }

  const character = castEntry.character
  const userName = persona?.name ?? member.character.name
  // Keywords are looked for in the latest few messages, so lore comes and goes
  // with what the scene is actually about.
  // The world's lorebook plus any lore the character carries from its card.
  const lore = activateLore(
    [...world.lore, ...normalizeLorebook(castEntry.character.lorebook)],
    history.slice(-LORE_SCAN_DEPTH).map((m) => m.content)
  )

  const prompt = buildPrompt({
    character,
    others: world.cast.map((c) => c.character).filter((c) => c.id !== character.id),
    userName,
    personaDescription: persona?.description,
    world,
    lore,
    history: history.map((m) => ({ characterId: m.characterId, characterName: m.character.name, content: m.content })),
  })

  let text: string
  try {
    text = await generateText({
      provider: preset.provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: decryptSecret(preset.apiKeyEnc),
      temperature: preset.temperature,
      maxTokens: preset.maxTokens,
      ...prompt,
    })
  } catch (error) {
    if (error instanceof GenerationError) return { ok: false, error: error.message }
    console.error("AI generation failed", error)
    return { ok: false, error: "Something went wrong while generating the reply." }
  }

  const content = cleanReply(text, character.name).slice(0, MAX_MESSAGE_LENGTH)
  const message = options.regenerateMessageId
    ? await prisma.message.update({
        where: { id: options.regenerateMessageId },
        data: { content },
        include: { character: true },
      })
    : await prisma.message.create({
        data: { worldId, characterId, authorId: userId, content, format: "MIXED", aiGenerated: true },
        include: { character: true },
      })

  return { ok: true, message: serializeMessage(message) }
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
  if ((memory?.length ?? 0) > 8000 || (systemPrompt?.length ?? 0) > 8000) {
    throw new Error("Keep memory and instructions under 8,000 characters each")
  }
  await prisma.world.update({ where: { id: worldId }, data: { memory, systemPrompt } })
  revalidatePath(`/worlds/${worldId}`)
}
