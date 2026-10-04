"use server"

import { prisma } from "@/lib/prisma"
import { requireUserId, requireWorldMembership } from "@/server/auth-guards"
import {
  serializeMessage,
  editSwipe,
  isStoredFormat,
  MESSAGE_PAGE_SIZE,
  MAX_MESSAGE_LENGTH,
  type SerializedMessage,
} from "@/lib/messages"

/** Only the author may change a message; returns it once that is established. */
async function requireOwnMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { character: true },
  })

  if (!message || message.deletedAt) throw new Error("Message not found")

  // With a shared cast, owning the character no longer implies having written
  // the message — the other writer may have voiced it. Authorship is recorded
  // on the message itself.
  if (message.authorId && message.authorId !== userId) {
    throw new Error("You can only change your own messages")
  }
  // Messages written before authorship was recorded fall back to who owns the
  // character, which is how it worked when they were written.
  if (!message.authorId && message.character.userId !== userId) {
    throw new Error("You can only change your own messages")
  }
  return message
}

function cleanContent(content: string) {
  const trimmed = content?.trim() ?? ""
  if (!trimmed) throw new Error("Message cannot be empty")
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message is too long (max ${MAX_MESSAGE_LENGTH.toLocaleString()} characters)`)
  }
  return trimmed
}

export async function createMessage(
  worldId: string,
  content: string,
  format: string,
  overrideCharacterId?: string
): Promise<SerializedMessage> {
  const userId = await requireUserId()

  const trimmed = cleanContent(content)
  if (!isStoredFormat(format)) throw new Error("Unknown message format")

  // Membership and cast membership are independent facts, so they are checked
  // in one trip rather than three: requireCastCharacter would otherwise repeat
  // the membership lookup this already needs.
  const [member, castEntry] = await Promise.all([
    prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId, userId } },
      select: { characterId: true },
    }),
    overrideCharacterId
      ? prisma.worldCharacter.findUnique({
          where: { worldId_characterId: { worldId, characterId: overrideCharacterId } },
          select: { characterId: true },
        })
      : Promise.resolve(null),
  ])

  if (!member) throw new Error("Not a member of this world")

  let targetCharacterId = member.characterId
  if (overrideCharacterId && overrideCharacterId !== member.characterId) {
    if (!castEntry) throw new Error("That character is not part of this world")
    targetCharacterId = castEntry.characterId
  }

  const message = await prisma.message.create({
    data: { worldId, characterId: targetCharacterId, authorId: userId, content: trimmed, format },
    include: { character: true },
  })

  // Readers pick this up on their next poll; there is no push channel, because
  // the app runs on a platform with no long-lived process.
  return serializeMessage(message)
}

export async function editMessage(messageId: string, content: string): Promise<SerializedMessage> {
  const userId = await requireUserId()
  const existing = await requireOwnMessage(userId, messageId)
  const trimmed = cleanContent(content)

  if (trimmed === existing.content) return serializeMessage(existing)

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { ...editSwipe(existing, trimmed), editedAt: new Date() },
    include: { character: true },
  })
  return serializeMessage(message)
}

export async function deleteMessage(messageId: string): Promise<{ id: string }> {
  const userId = await requireUserId()
  await requireOwnMessage(userId, messageId)

  // Soft delete: the row has to keep existing so the other person's next poll
  // can learn it went away. `updatedAt` advances, which is what they poll on.
  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })
  return { id: messageId }
}

/**
 * Everything that changed since `cursor` — new messages, edits, and deletions.
 *
 * This is the chat's live feed. Polling on `updatedAt` rather than `timestamp`
 * is what lets an edit or a deletion reach the other person; a query for newer
 * timestamps alone would never mention a message that already existed.
 */
export async function fetchChangesSince(
  worldId: string,
  cursor: string
): Promise<{ messages: SerializedMessage[]; deletedIds: string[]; cursor: string }> {
  const userId = await requireUserId()

  const since = new Date(cursor)
  if (Number.isNaN(since.getTime())) throw new Error("Invalid cursor")

  // This runs every few seconds for as long as a world is open, so the
  // membership check goes alongside the fetch rather than before it. The rows
  // are discarded unless the check passes, so nothing leaks by reading early.
  const [member, changed] = await Promise.all([
    prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId, userId } },
      select: { id: true },
    }),
    prisma.message.findMany({
      where: { worldId, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
      include: { character: true },
      take: 500,
    }),
  ])
  if (!member) throw new Error("Not a member of this world")

  const live = changed.filter((m) => !m.deletedAt)
  const deletedIds = changed.filter((m) => m.deletedAt).map((m) => m.id)
  const newest = changed.at(-1)?.updatedAt.toISOString() ?? cursor

  return { messages: live.map(serializeMessage), deletedIds, cursor: newest }
}

/** The page of messages immediately before `beforeTimestamp`, oldest first. */
export async function fetchOlderMessages(
  worldId: string,
  beforeTimestamp: string
): Promise<{ messages: SerializedMessage[]; hasMore: boolean }> {
  const userId = await requireUserId()

  const before = new Date(beforeTimestamp)
  if (Number.isNaN(before.getTime())) throw new Error("Invalid timestamp")

  const [member, messages] = await Promise.all([
    prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId, userId } },
      select: { id: true },
    }),
    prisma.message.findMany({
      where: { worldId, deletedAt: null, timestamp: { lt: before } },
      orderBy: { timestamp: "desc" },
      include: { character: true },
      take: MESSAGE_PAGE_SIZE + 1,
    }),
  ])
  if (!member) throw new Error("Not a member of this world")

  const hasMore = messages.length > MESSAGE_PAGE_SIZE
  const page = hasMore ? messages.slice(0, MESSAGE_PAGE_SIZE) : messages

  return { messages: page.reverse().map(serializeMessage), hasMore }
}

/**
 * Shows another version of the latest AI reply. Any member may swipe, as any
 * member may regenerate: it is the shared story's next line being chosen.
 */
export async function selectSwipe(messageId: string, index: number): Promise<SerializedMessage> {
  const userId = await requireUserId()
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message || message.deletedAt || !message.aiGenerated) throw new Error("Message not found")
  await requireWorldMembership(userId, message.worldId)

  const latest = await prisma.message.findFirst({
    where: { worldId: message.worldId, deletedAt: null },
    orderBy: { timestamp: "desc" },
    select: { id: true },
  })
  if (latest?.id !== messageId) throw new Error("Only the latest reply can be swiped")
  if (!Number.isInteger(index) || index < 0 || index >= message.swipes.length) throw new Error("No such version")

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: message.swipes[index], swipeIndex: index },
    include: { character: true },
  })
  return serializeMessage(updated)
}
