import Anthropic from "@anthropic-ai/sdk"
import { PROVIDERS, type ProviderId } from "@/lib/ai/providers"
import type { ChatTurn } from "@/lib/ai/prompt"

export type GenerateRequest = {
  provider: ProviderId
  baseUrl: string | null
  model: string
  apiKey: string
  temperature: number
  maxTokens: number
  system: string
  messages: ChatTurn[]
}

/** Shown to the user as-is, so it must never include the key. */
export class GenerationError extends Error {}

/** Models that take Anthropic's server-side refusal fallback. */
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"])

/** The model router: one call shape in, the reply text out, whatever the provider. */
export async function generateText(req: GenerateRequest): Promise<string> {
  return PROVIDERS[req.provider].kind === "anthropic" ? viaAnthropic(req) : viaOpenAICompatible(req)
}

async function viaAnthropic(req: GenerateRequest) {
  const client = new Anthropic({ apiKey: req.apiKey, maxRetries: 1, timeout: 240_000 })
  try {
    const response = await client.beta.messages.create({
      model: req.model,
      // Current Claude models think before answering and that thinking counts
      // against max_tokens, so the reply length is steered by the prompt
      // instead. Temperature is not sent: current models reject it.
      max_tokens: 16000,
      system: req.system,
      messages: req.messages,
      // On a policy decline the API retries on a suitable model in the same call.
      ...(FALLBACK_MODELS.has(req.model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    })
    if (response.stop_reason === "refusal") {
      throw new GenerationError("The model declined to write this reply. Try rephrasing or regenerating.")
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("")
    if (!text.trim()) throw new GenerationError("The model returned an empty reply.")
    return text
  } catch (error) {
    if (error instanceof GenerationError) throw error
    if (error instanceof Anthropic.AuthenticationError) throw new GenerationError("Anthropic rejected the API key.")
    if (error instanceof Anthropic.NotFoundError) throw new GenerationError(`Anthropic has no model called "${req.model}".`)
    if (error instanceof Anthropic.RateLimitError) throw new GenerationError("Anthropic rate limit reached. Wait a moment and try again.")
    if (error instanceof Anthropic.APIError) throw new GenerationError(`Anthropic error ${error.status ?? ""}: ${error.message}`.slice(0, 300))
    throw new GenerationError("Could not reach Anthropic.")
  }
}

async function viaOpenAICompatible(req: GenerateRequest) {
  const base = (req.provider === "custom" ? req.baseUrl : PROVIDERS[req.provider].baseUrl)?.replace(/\/+$/, "")
  if (!base) throw new GenerationError("This preset has no endpoint URL.")

  let res: Response
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${req.apiKey}` },
      body: JSON.stringify({
        model: req.model,
        messages: [{ role: "system", content: req.system }, ...req.messages],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
      }),
      // Never follow a redirect: the URL was checked, wherever it points was not.
      redirect: "error",
      signal: AbortSignal.timeout(180_000),
    })
  } catch {
    throw new GenerationError(`Could not reach ${new URL(base).host}.`)
  }

  const body = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string } | string
  } | null

  if (!res.ok) {
    const detail = typeof body?.error === "string" ? body.error : body?.error?.message
    if (res.status === 401 || res.status === 403) throw new GenerationError("The provider rejected the API key.")
    throw new GenerationError(`Provider error ${res.status}${detail ? `: ${detail}` : ""}`.slice(0, 300))
  }
  const text = body?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new GenerationError("The model returned an empty reply.")
  return text
}

/**
 * Checks a custom endpoint before the server is pointed at it. The server
 * makes the request, so a URL aimed at private addresses could be used to probe
 * the host's network.
 * ponytail: checks the literal hostname only; a public name that resolves to a
 * private address (DNS rebinding) is not caught. Resolve and pin if needed.
 */
export function checkEndpointUrl(raw: string) {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("Endpoint must be a full URL, e.g. https://example.com/v1")
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  const local =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "::1" ||
    /^f[cd]/.test(host) ||
    /^fe80:/.test(host)

  if (local && process.env.NODE_ENV === "production") {
    throw new Error("Private and local addresses can't be reached from the hosted app.")
  }
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("Endpoint must use https://")
  }
  return url.toString().replace(/\/+$/, "")
}
