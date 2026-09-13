"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUserId, requireEditableCharacter } from "@/server/auth-guards"
import { normalizeColor, parseDataUrl } from "@/lib/characters"
import { normalizeAppearance } from "@/lib/appearance"

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
  return { name, avatarUrl, bio, title, color }
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
