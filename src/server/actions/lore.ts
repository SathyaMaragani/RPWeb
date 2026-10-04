"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId, requireWorldMembership } from "@/server/auth-guards"
import { parseKeywords } from "@/lib/ai/lore"
import { parseLorebookFile, toWorldInfo } from "@/lib/cards"

function readLoreForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim()
  const content = (formData.get("content") as string | null)?.trim()
  const keywords = parseKeywords(String(formData.get("keywords") ?? ""))
  const constant = formData.get("constant") === "on"
  const priority = Number(formData.get("priority") ?? 0)

  if (!name || name.length > 80) throw new Error("Give the entry a name (up to 80 characters)")
  if (!content) throw new Error("Write what the AI should know")
  if (content.length > 6000) throw new Error("Keep an entry under 6,000 characters")
  if (!constant && keywords.length === 0) throw new Error("Add at least one keyword, or mark it always included")
  if (!Number.isInteger(priority) || priority < -100 || priority > 100) throw new Error("Priority must be between -100 and 100")

  return {
    name,
    content,
    keywords,
    constant,
    priority,
    enabled: formData.get("enabled") === "on",
    caseSensitive: formData.get("caseSensitive") === "on",
    wholeWord: formData.get("wholeWord") === "on",
  }
}

/** Any member may edit a world's lore, like the rest of the shared story. */
async function requireLoreInWorld(userId: string, entryId: string) {
  const entry = await prisma.loreEntry.findUnique({ where: { id: entryId }, select: { id: true, worldId: true } })
  if (!entry) throw new Error("Entry not found")
  await requireWorldMembership(userId, entry.worldId)
  return entry
}

export async function createLoreEntry(worldId: string, formData: FormData) {
  const userId = await requireUserId()
  await requireWorldMembership(userId, worldId)
  await prisma.loreEntry.create({ data: { worldId, ...readLoreForm(formData) } })
  revalidatePath(`/worlds/${worldId}/lore`)
}

export async function updateLoreEntry(entryId: string, formData: FormData) {
  const userId = await requireUserId()
  const entry = await requireLoreInWorld(userId, entryId)
  await prisma.loreEntry.update({ where: { id: entry.id }, data: readLoreForm(formData) })
  revalidatePath(`/worlds/${entry.worldId}/lore`)
}

export async function deleteLoreEntry(entryId: string) {
  const userId = await requireUserId()
  const entry = await requireLoreInWorld(userId, entryId)
  await prisma.loreEntry.delete({ where: { id: entry.id } })
  revalidatePath(`/worlds/${entry.worldId}/lore`)
}

/** Adds entries from a lorebook file (World Info, character book or card) to a world. */
export async function importLore(worldId: string, raw: unknown) {
  const userId = await requireUserId()
  await requireWorldMembership(userId, worldId)
  const { entries, warnings } = parseLorebookFile(raw)
  await prisma.loreEntry.createMany({ data: entries.map((e) => ({ ...e, worldId })) })
  revalidatePath(`/worlds/${worldId}/lore`)
  return { added: entries.length, warnings }
}

/** A world's lore as a SillyTavern World Info file. */
export async function exportLore(worldId: string) {
  const userId = await requireUserId()
  await requireWorldMembership(userId, worldId)
  const world = await prisma.world.findUniqueOrThrow({
    where: { id: worldId },
    select: { name: true, lore: { orderBy: [{ priority: "desc" }, { name: "asc" }] } },
  })
  return toWorldInfo(`${world.name} lore`, world.lore)
}
