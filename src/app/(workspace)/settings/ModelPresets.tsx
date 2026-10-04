import { Bot, KeyRound, Star, Trash2 } from "lucide-react"
import { PROVIDERS } from "@/lib/ai/providers"
import {
  createModelPreset,
  deleteModelPreset,
  setDefaultModelPreset,
  updateModelPreset,
} from "@/server/actions/models"

export type PresetRow = {
  id: string
  name: string
  provider: string
  baseUrl: string | null
  model: string
  keyHint: string
  temperature: number
  maxTokens: number
  isDefault: boolean
}

const input =
  "mt-1 block w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"

function PresetFields({ preset }: { preset?: PresetRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs text-muted">
        Name
        <input name="name" required maxLength={60} defaultValue={preset?.name ?? ""} placeholder="Claude RP" className={input} />
      </label>
      <label className="block text-xs text-muted">
        Provider
        <select name="provider" defaultValue={preset?.provider ?? "anthropic"} className={input}>
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <option key={id} value={id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Model
        <input
          name="model"
          required
          maxLength={120}
          defaultValue={preset?.model ?? ""}
          placeholder="claude-opus-5-5, deepseek-chat, ..."
          className={input}
        />
      </label>
      <label className="block text-xs text-muted">
        API key {preset && <span>(blank keeps the saved key)</span>}
        <input
          name="apiKey"
          type="password"
          autoComplete="off"
          required={!preset}
          placeholder={preset ? `ends in ${preset.keyHint}` : "sk-..."}
          className={input}
        />
      </label>
      <label className="block text-xs text-muted sm:col-span-2">
        Endpoint URL <span>(Custom provider only, e.g. https://my-host.example/v1)</span>
        <input name="baseUrl" type="url" defaultValue={preset?.baseUrl ?? ""} className={input} />
      </label>
      <label className="block text-xs text-muted">
        Temperature <span>(ignored by Claude)</span>
        <input name="temperature" type="number" min={0} max={2} step={0.05} defaultValue={preset?.temperature ?? 0.9} className={input} />
      </label>
      <label className="block text-xs text-muted">
        Max reply tokens <span>(ignored by Claude)</span>
        <input name="maxTokens" type="number" min={50} max={8000} step={50} defaultValue={preset?.maxTokens ?? 800} className={input} />
      </label>
    </div>
  )
}

/** Saved models reached with the user's own API keys. */
export default function ModelPresets({ presets }: { presets: PresetRow[] }) {
  return (
    <section id="ai-models" className="mb-8 rounded-2xl border border-line bg-surface p-6">
      <div className="mb-2 flex items-center gap-3">
        <Bot size={20} className="text-accent" />
        <h2 className="text-lg font-semibold text-ink">AI models</h2>
      </div>
      <p className="mb-5 text-sm text-muted">
        AI characters reply using your own API key, so you pay your provider directly. Keys are encrypted and never
        shown again. Your default model is used whenever you ask a character to reply.
      </p>

      {presets.length > 0 && (
        <ul className="mb-5 space-y-2">
          {presets.map((p) => (
            <li key={p.id}>
              <details className="rounded-xl border border-line bg-canvas p-3 open:space-y-3">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <KeyRound size={16} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      {p.name}
                      {p.isDefault && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-soft">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {PROVIDERS[p.provider as keyof typeof PROVIDERS]?.label ?? p.provider} · {p.model} · key …{p.keyHint}
                    </div>
                  </div>
                  <span className="text-xs text-muted">Edit</span>
                </summary>
                <form action={updateModelPreset.bind(null, p.id)} className="space-y-3">
                  <PresetFields preset={p} />
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-soft">Save</button>
                    {!p.isDefault && (
                      <button
                        formAction={setDefaultModelPreset.bind(null, p.id)}
                        formNoValidate
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs text-ink hover:border-accent/50"
                      >
                        <Star size={13} /> Make default
                      </button>
                    )}
                    <button
                      formAction={deleteModelPreset.bind(null, p.id)}
                      formNoValidate
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs text-muted hover:border-red-500/40 hover:text-red-400"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}

      <details open={presets.length === 0} className="rounded-xl border border-dashed border-line p-3 open:space-y-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-accent-soft">+ Add a model</summary>
        <form action={createModelPreset} className="space-y-3">
          <PresetFields />
          <button className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-soft">
            Save model
          </button>
        </form>
      </details>
    </section>
  )
}
