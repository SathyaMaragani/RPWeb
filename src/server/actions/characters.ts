"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId, requireEditableCharacter } from "@/server/auth-guards"
import { normalizeColor, parseDataUrl, parseTags, avatarSrc, CHARACTER_VISIBILITIES } from "@/lib/characters"
import { normalizeAppearance } from "@/lib/appearance"
import { CARD_FIELD_MAX, normalizeLorebook, parseCard, toCardV2 } from "@/lib/cards"

function readCharacterForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim()
  const avatarUrl = (formData.get("avatarUrl") as string | null)?.trim() || null
  const bio = (formData.get("bio") as string | null)?.trim() || null
  const title = (formData.get("title") as string | null)?.trim() || null
  const color = normalizeColor(formData.get("color") as string | null)

  if (!name) throw new Error("Name is required")
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    throw new Error("Avatar must be a http(s) image URL")
  }
  return { name, avatarUrl, bio, title, color, ...readCard(formData) }
}

const text = (formData: FormData, key: string, max: number) => {
  const value = (formData.get(key) as string | null)?.trim() || null
  if (value && value.length > max) throw new Error(`${key} is too long (max ${max.toLocaleString()} characters)`)
  return value
}

/** The character-card fields an AI uses to play the character. */
function readCard(formData: FormData) {
  const visibility = String(formData.get("visibility") ?? "PRIVATE")
  if (!CHARACTER_VISIBILITIES.includes(visibility as never)) throw new Error("Unknown visibility")
  return {
    personality: text(formData, "personality", CARD_FIELD_MAX),
    scenario: text(formData, "scenario", CARD_FIELD_MAX),
    greeting: text(formData, "greeting", CARD_FIELD_MAX),
    exampleDialogue: text(formData, "exampleDialogue", CARD_FIELD_MAX),
    tags: parseTags(String(formData.get("tags") ?? "")),
    visibility,
  }
}

/**
 * Applies whatever the picture field asked for.
 *
 * Absent means the form did not touch it, so a stored avatar survives editing
 * the name. An empty string means remove it. Anything else is a freshly
 * cropped image to store.
 */
async function applyAvatarImage(characterId: string, raw: FormDataEntryValue | null) {
  if (raw === null) return
  const value = String(raw)

  if (!value) {
    await prisma.characterAvatar.deleteMany({ where: { characterId } })
    await prisma.character.update({
      where: { id: characterId },
      data: { avatarUpdatedAt: null },
    })
    return
  }

  const { mime, bytes } = parseDataUrl(value)
  const now = new Date()
  await prisma.characterAvatar.upsert({
    where: { characterId },
    create: { characterId, data: bytes, mime },
    update: { data: bytes, mime },
  })
  // Bumped so the image URL changes and caches do not serve the old picture.
  await prisma.character.update({
    where: { id: characterId },
    data: { avatarUpdatedAt: now },
  })
}

export async function createCharacter(formData: FormData) {
  const userId = await requireUserId()
  const data = readCharacterForm(formData)

  const character = await prisma.character.create({
    data: { userId, ...data },
  })
  const upload = formData.get("avatarImage")
  await applyAvatarImage(character.id, upload)

  revalidatePath("/dashboard")
  revalidatePath("/characters")
  // Someone who gave no picture goes straight on to design one.
  redirect(upload || data.avatarUrl ? "/characters" : `/characters/${character.id}/customize`)
}

/**
 * Saves a designed look. The payload is rebuilt from the catalogue before it
 * is stored, so only known asset ids and hex colours are ever kept.
 */
export async function saveAppearance(characterId: string, appearance: unknown) {
  const userId = await requireUserId()
  await requireEditableCharacter(userId, characterId)

  const now = new Date()
  await prisma.character.update({
    where: { id: characterId },
    data: {
      appearance: normalizeAppearance(appearance),
      appearanceUpdatedAt: now,
    },
  })

  revalidatePath("/characters")
  revalidatePath("/dashboard")
  // The portrait is the avatar everywhere the character appears.
  revalidatePath("/worlds", "layout")
  return { savedAt: now.toISOString() }
}

export async function editCharacter(characterId: string, formData: FormData) {
  const userId = await requireUserId()
  const data = readCharacterForm(formData)

  await requireEditableCharacter(userId, characterId)

  await prisma.character.update({
    where: { id: characterId },
    data,
  })
  await applyAvatarImage(characterId, formData.get("avatarImage"))

  revalidatePath("/characters")
  revalidatePath("/dashboard")
  // A character's look is shared, so every world showing it is now stale.
  revalidatePath("/worlds", "layout")
  redirect("/characters")
}

/**
 * Creates a character from a Tavern card (V1/V2/V3 JSON, already pulled out of
 * a PNG by the browser). The card is parsed again here: the browser's preview
 * is a convenience, not something to trust. `avatarImage` is the card picture,
 * cropped and resized in the browser like any other upload.
 */
export async function importCharacterCard(card: unknown, avatarImage: string | null) {
  const userId = await requireUserId()
  const parsed = parseCard(card)

  const character = await prisma.character.create({
    data: {
      userId,
      name: parsed.name,
      bio: parsed.bio,
      personality: parsed.personality,
      scenario: parsed.scenario,
      greeting: parsed.greeting,
      exampleDialogue: parsed.exampleDialogue,
      tags: parsed.tags,
      lorebook: parsed.lorebook.length ? parsed.lorebook : undefined,
    },
  })
  if (avatarImage) await applyAvatarImage(character.id, avatarImage)

  revalidatePath("/characters")
  return { id: character.id }
}

/** A character as a V2 card, plus where its picture loads from, for download. */
export async function exportCharacterCard(characterId: string) {
  const userId = await requireUserId()
  await requireEditableCharacter(userId, characterId)
  const c = await prisma.character.findUniqueOrThrow({ where: { id: characterId } })
  return {
    card: toCardV2({ ...c, lorebook: normalizeLorebook(c.lorebook) }),
    imageSrc: avatarSrc(c),
  }
}
