"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"

function readPersonaForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim()
  const avatarUrl = (formData.get("avatarUrl") as string | null)?.trim() || null
  const description = (formData.get("description") as string | null)?.trim() || null

  if (!name) throw new Error("Name is required")
  if (name.length > 80) throw new Error("Name is too long")
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) throw new Error("Avatar must be a http(s) image URL")
  if (description && description.length > 6000) throw new Error("Description is too long (max 6,000 characters)")
  return { name, avatarUrl, description }
}

/** Only the owner may touch a persona; returns its id once that is established. */
async function requireOwnPersona(userId: string, personaId: string) {
  const persona = await prisma.persona.findFirst({ where: { id: personaId, userId }, select: { id: true } })
  if (!persona) throw new Error("Persona not found")
  return persona.id
}

export async function createPersona(formData: FormData) {
  const userId = await requireUserId()
  const data = readPersonaForm(formData)
  // The first persona someone makes is the one used until they choose another.
  const existing = await prisma.persona.count({ where: { userId } })
  await prisma.persona.create({ data: { userId, ...data, isDefault: existing === 0 } })
  revalidatePath("/personas")
}

export async function updatePersona(personaId: string, formData: FormData) {
  const userId = await requireUserId()
  const id = await requireOwnPersona(userId, personaId)
  await prisma.persona.update({ where: { id }, data: readPersonaForm(formData) })
  revalidatePath("/personas")
}

export async function deletePersona(personaId: string) {
  const userId = await requireUserId()
  const id = await requireOwnPersona(userId, personaId)
  const removed = await prisma.persona.delete({ where: { id } })
  // Keep exactly one default while any persona remains.
  if (removed.isDefault) {
    const next = await prisma.persona.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } })
    if (next) await prisma.persona.update({ where: { id: next.id }, data: { isDefault: true } })
  }
  revalidatePath("/personas")
}

export async function setDefaultPersona(personaId: string) {
  const userId = await requireUserId()
  const id = await requireOwnPersona(userId, personaId)
  await prisma.$transaction([
    prisma.persona.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.persona.update({ where: { id }, data: { isDefault: true } }),
  ])
  revalidatePath("/personas")
}
