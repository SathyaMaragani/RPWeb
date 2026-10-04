"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"
import { isProviderId } from "@/lib/ai/providers"
import { encryptSecret } from "@/server/ai/crypto"
import { checkEndpointUrl } from "@/server/ai/generate"

function readPresetForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim()
  const provider = String(formData.get("provider") ?? "")
  const model = (formData.get("model") as string | null)?.trim()
  const rawUrl = (formData.get("baseUrl") as string | null)?.trim() || ""
  const temperature = Number(formData.get("temperature") ?? 0.9)
  const maxTokens = Number(formData.get("maxTokens") ?? 800)
  const rawTopP = String(formData.get("topP") ?? "").trim()
  const topP = rawTopP ? Number(rawTopP) : null
  const contextTokens = Number(formData.get("contextTokens") ?? 6000)

  if (!name || name.length > 60) throw new Error("Give the preset a name (up to 60 characters)")
  if (!isProviderId(provider)) throw new Error("Unknown provider")
  if (!model || model.length > 120) throw new Error("Model is required")
  if (!(temperature >= 0 && temperature <= 2)) throw new Error("Temperature must be between 0 and 2")
  if (!(Number.isInteger(maxTokens) && maxTokens >= 50 && maxTokens <= 8000)) {
    throw new Error("Max tokens must be a whole number between 50 and 8000")
  }
  if (topP !== null && !(topP > 0 && topP <= 1)) throw new Error("Top-p must be between 0 and 1, or blank")
  if (!(Number.isInteger(contextTokens) && contextTokens >= 1000 && contextTokens <= 200000)) {
    throw new Error("Context size must be a whole number between 1,000 and 200,000 tokens")
  }
  const baseUrl = provider === "custom" ? checkEndpointUrl(rawUrl) : null
  return { name, provider, model, baseUrl, temperature, maxTokens, topP, contextTokens }
}

async function requireOwnPreset(userId: string, presetId: string) {
  const preset = await prisma.modelPreset.findFirst({ where: { id: presetId, userId }, select: { id: true } })
  if (!preset) throw new Error("Preset not found")
  return preset.id
}

export async function createModelPreset(formData: FormData) {
  const userId = await requireUserId()
  const data = readPresetForm(formData)
  const apiKey = (formData.get("apiKey") as string | null)?.trim()
  if (!apiKey) throw new Error("API key is required")

  const existing = await prisma.modelPreset.count({ where: { userId } })
  await prisma.modelPreset.create({
    data: {
      userId,
      ...data,
      apiKeyEnc: encryptSecret(apiKey),
      keyHint: apiKey.slice(-4),
      isDefault: existing === 0,
    },
  })
  revalidatePath("/settings")
}

/** A blank key field keeps the stored key. */
export async function updateModelPreset(presetId: string, formData: FormData) {
  const userId = await requireUserId()
  const id = await requireOwnPreset(userId, presetId)
  const apiKey = (formData.get("apiKey") as string | null)?.trim()
  await prisma.modelPreset.update({
    where: { id },
    data: {
      ...readPresetForm(formData),
      ...(apiKey ? { apiKeyEnc: encryptSecret(apiKey), keyHint: apiKey.slice(-4) } : {}),
    },
  })
  revalidatePath("/settings")
}

export async function deleteModelPreset(presetId: string) {
  const userId = await requireUserId()
  const id = await requireOwnPreset(userId, presetId)
  const removed = await prisma.modelPreset.delete({ where: { id } })
  if (removed.isDefault) {
    const next = await prisma.modelPreset.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } })
    if (next) await prisma.modelPreset.update({ where: { id: next.id }, data: { isDefault: true } })
  }
  revalidatePath("/settings")
}

export async function setDefaultModelPreset(presetId: string) {
  const userId = await requireUserId()
  const id = await requireOwnPreset(userId, presetId)
  await prisma.$transaction([
    prisma.modelPreset.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.modelPreset.update({ where: { id }, data: { isDefault: true } }),
  ])
  revalidatePath("/settings")
}
