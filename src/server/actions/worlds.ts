"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId, requireOwnedCharacter, requireWorldMembership } from "@/server/auth-guards"
import { generateInviteCode } from "@/lib/invite-code"
import { parseDataUrl, MAX_BANNER_BYTES } from "@/lib/characters"

export async function createWorld(formData: FormData) {
  const userId = await requireUserId()

  const name = (formData.get("name") as string | null)?.trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const characterId = formData.get("characterId") as string

  if (!name) throw new Error("Name is required")
  // The character id comes straight from the form, so ownership is verified
  // before it is attached to a membership.
  const ownedCharacterId = await requireOwnedCharacter(userId, characterId)

  const world = await prisma.world.create({
    data: {
      name,
      description,
      inviteCode: await generateInviteCode(),
      ownerId: userId,
      members: {
        create: {
          userId,
          characterId: ownedCharacterId,
          role: "OWNER",
        },
      },
      cast: { create: { characterId: ownedCharacterId } },
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/worlds")
  redirect(`/worlds/${world.id}`)
}

export async function joinWorld(formData: FormData) {
  const userId = await requireUserId()

  const inviteCode = (formData.get("inviteCode") as string | null)?.trim().toUpperCase()
  const submittedCharacterId = formData.get("characterId") as string

  if (!inviteCode) throw new Error("Invite code is required")
  const ownedCharacterId = await requireOwnedCharacter(userId, submittedCharacterId)

  const world = await prisma.world.findUnique({
    where: { inviteCode },
    select: { id: true },
  })

  if (!world) throw new Error("Invalid invite code")

  // If the world already has a character by this name, join as that one rather
  // than adding a second copy. Two rows with the same name would show as two
  // different people, with separate colours and a split history.
  const chosen = await prisma.character.findUnique({
    where: { id: ownedCharacterId },
    select: { name: true },
  })
  const existing = chosen
    ? await prisma.worldCharacter.findFirst({
        where: {
          worldId: world.id,
          character: { name: { equals: chosen.name, mode: "insensitive" } },
        },
        select: { characterId: true },
      })
    : null
  const characterId = existing?.characterId ?? ownedCharacterId

  const existingMember = await prisma.worldMember.findUnique({
    where: { worldId_userId: { worldId: world.id, userId } },
    select: { id: true },
  })

  if (!existingMember) {
    await prisma.worldMember.create({
      data: { worldId: world.id, userId, characterId, role: "MEMBER" },
    })
    await prisma.worldCharacter.upsert({
      where: { worldId_characterId: { worldId: world.id, characterId } },
      create: { worldId: world.id, characterId },
      update: {},
    })
    revalidatePath("/dashboard")
    revalidatePath("/worlds")
  }

  redirect(`/worlds/${world.id}`)
}

/** Owner-only edit of the world's presentation: name, description, banner. */
export async function updateWorld(worldId: string, formData: FormData) {
  const userId = await requireUserId()

  // Anyone in the world may change how it looks, like the cast and the story
  // itself. Ownership only records who created it.
  await requireWorldMembership(userId, worldId)

  const name = (formData.get("name") as string | null)?.trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const bannerUrl = (formData.get("bannerUrl") as string | null)?.trim() || null

  if (!name) throw new Error("Name is required")
  if (bannerUrl && !/^https?:\/\//i.test(bannerUrl)) {
    throw new Error("Banner must be a http(s) image URL")
  }

  await prisma.world.update({
    where: { id: worldId },
    data: { name, description, bannerUrl },
  })
  await applyBannerImage(worldId, formData.get("bannerImage"))

  revalidatePath(`/worlds/${worldId}`)
  revalidatePath("/worlds")
  revalidatePath("/dashboard")
}

/**
 * Applies whatever the banner field asked for.
 *
 * Absent means the form did not touch it, so an uploaded banner survives an
 * edit to the name. Empty means remove it. Anything else is a cropped image.
 */
async function applyBannerImage(worldId: string, raw: FormDataEntryValue | null) {
  if (raw === null) return
  const value = String(raw)

  if (!value) {
    await prisma.worldBanner.deleteMany({ where: { worldId } })
    await prisma.world.update({ where: { id: worldId }, data: { bannerUpdatedAt: null } })
    return
  }

  const { mime, bytes } = parseDataUrl(value, MAX_BANNER_BYTES)
  await prisma.worldBanner.upsert({
    where: { worldId },
    create: { worldId, data: bytes, mime },
    update: { data: bytes, mime },
  })
  // Bumped so the image URL changes and caches stop serving the old banner.
  await prisma.world.update({
    where: { id: worldId },
    data: { bannerUpdatedAt: new Date() },
  })
}

/**
 * Brings one of your characters into a world's cast.
 *
 * Characters and worlds are created independently, so a character made after
 * a world exists had no way in: the cast was only ever filled when a world was
 * created, joined, or imported. Once added, every member can write as it, like
 * the rest of the cast.
 */
export async function addCharacterToWorld(worldId: string, characterId: string) {
  const userId = await requireUserId()

  // You may add a character you created. Everything already in the cast is
  // usable by everyone, but bringing a new face in is the author's call.
  const [, ownedCharacterId] = await Promise.all([
    requireWorldMembership(userId, worldId),
    requireOwnedCharacter(userId, characterId),
  ])

  await prisma.worldCharacter.upsert({
    where: { worldId_characterId: { worldId, characterId: ownedCharacterId } },
    create: { worldId, characterId: ownedCharacterId },
    update: {},
  })

  revalidatePath(`/worlds/${worldId}`)
  revalidatePath("/characters")
}

/**
 * Starts a new world holding the story up to (and including) one message:
 * the same cast and AI settings, lore, memory and banner, with the person
 * branching as its owner. The original world is not changed at all, which is
 * why this is the way to take a shared story somewhere else from an earlier
 * point: nothing anyone wrote after it is touched.
 */
export async function branchWorld(messageId: string) {
  const userId = await requireUserId()
  const point = await prisma.message.findUnique({ where: { id: messageId }, select: { worldId: true, timestamp: true, deletedAt: true } })
  if (!point || point.deletedAt) throw new Error("Message not found")
  const member = await requireWorldMembership(userId, point.worldId)

  const source = await prisma.world.findUniqueOrThrow({
    where: { id: point.worldId },
    include: { cast: true, lore: true, banner: true },
  })
  const inviteCode = await generateInviteCode()

  const branch = await prisma.$transaction(
    async (tx) => {
      const world = await tx.world.create({
        data: {
          name: `${source.name} (branch)`.slice(0, 120),
          description: source.description,
          bannerUrl: source.bannerUrl,
          bannerUpdatedAt: source.banner ? new Date() : null,
          memory: source.memory,
          systemPrompt: source.systemPrompt,
          // The summary only still fits if it ends at or before the branch point.
          ...(source.summaryUntil && source.summaryUntil <= point.timestamp
            ? { summary: source.summary, summaryUntil: source.summaryUntil }
            : {}),
          inviteCode,
          ownerId: userId,
          members: { create: { userId, characterId: member.characterId, role: "OWNER" } },
          cast: {
            create: source.cast.map((c) => ({ characterId: c.characterId, aiEnabled: c.aiEnabled })),
          },
          lore: {
            create: source.lore.map((e) => ({
              name: e.name,
              keywords: e.keywords,
              content: e.content,
              constant: e.constant,
              enabled: e.enabled,
              caseSensitive: e.caseSensitive,
              wholeWord: e.wholeWord,
              priority: e.priority,
            })),
          },
          ...(source.banner ? { banner: { create: { data: source.banner.data, mime: source.banner.mime } } } : {}),
        },
      })

      const messages = await tx.message.findMany({
        where: { worldId: source.id, deletedAt: null, timestamp: { lte: point.timestamp } },
        orderBy: { timestamp: "asc" },
      })
      await tx.message.createMany({
        data: messages.map((m) => ({
          worldId: world.id,
          characterId: m.characterId,
          authorId: m.authorId,
          content: m.content,
          format: m.format,
          timestamp: m.timestamp,
          isImported: m.isImported,
          aiGenerated: m.aiGenerated,
          swipes: m.swipes,
          swipeIndex: m.swipeIndex,
          editedAt: m.editedAt,
        })),
      })
      return world
    },
    // Copying a long story can take a while on a sleepy free database.
    { timeout: 30_000 }
  )

  revalidatePath("/worlds")
  revalidatePath("/dashboard")
  return { worldId: branch.id }
}
