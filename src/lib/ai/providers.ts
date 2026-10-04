/**
 * Where a model preset can send requests. Anthropic goes through its SDK;
 * everything else speaks the OpenAI chat-completions format.
 */
export const PROVIDERS = {
  anthropic: { label: "Anthropic (Claude)", kind: "anthropic", baseUrl: null, modelHint: "claude-opus-5-5" },
  openai: { label: "OpenAI", kind: "openai", baseUrl: "https://api.openai.com/v1", modelHint: "model id from your OpenAI account" },
  openrouter: { label: "OpenRouter", kind: "openai", baseUrl: "https://openrouter.ai/api/v1", modelHint: "e.g. anthropic/claude-opus-5-5" },
  deepseek: { label: "DeepSeek", kind: "openai", baseUrl: "https://api.deepseek.com/v1", modelHint: "e.g. deepseek-chat" },
  groq: { label: "Groq", kind: "openai", baseUrl: "https://api.groq.com/openai/v1", modelHint: "model id from Groq" },
  together: { label: "Together", kind: "openai", baseUrl: "https://api.together.xyz/v1", modelHint: "model id from Together" },
  custom: { label: "Custom (OpenAI-compatible URL)", kind: "openai", baseUrl: null, modelHint: "model id your endpoint serves" },
} as const

export type ProviderId = keyof typeof PROVIDERS

export const isProviderId = (value: string): value is ProviderId => value in PROVIDERS
