"use client"

import { useState } from "react"
import { Download, Loader2, Upload } from "lucide-react"
import { exportLore, importLore } from "@/server/actions/lore"

/** Import a lorebook file into this world, or download its lore. */
export default function LoreTransfer({ worldId, worldName }: { worldId: string; worldName: string }) {
  const [busy, setBusy] = useState<"in" | "out" | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const upload = async (file: File) => {
    setBusy("in")
    setMessage(null)
    try {
      const raw = JSON.parse(await file.text())
      const { added, warnings } = await importLore(worldId, raw)
      setMessage({ ok: true, text: `Added ${added} ${added === 1 ? "entry" : "entries"}.${warnings.length ? " " + warnings.join(" ") : ""}` })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof SyntaxError ? "That file isn't valid JSON." : "Couldn't import that file: it has no usable lorebook entries." })
    } finally {
      setBusy(null)
    }
  }

  const download = async () => {
    setBusy("out")
    setMessage(null)
    try {
      const data = await exportLore(worldId)
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `${worldName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "world"}-lore.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setMessage({ ok: false, text: "Couldn't export the lore." })
    } finally {
      setBusy(null)
    }
  }

  const button =
    "inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-ink transition hover:border-accent/50"

  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className={`${button} cursor-pointer`}>
          {busy === "in" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          Import lorebook
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file)
              e.target.value = ""
            }}
          />
        </label>
        <button type="button" onClick={() => void download()} disabled={busy !== null} className={button}>
          {busy === "out" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export lorebook
        </button>
      </div>
      <p className="text-[11px] text-muted">
        Imports SillyTavern World Info, a character book, or a character card&rsquo;s lorebook. Exports World Info.
      </p>
      {message && <p className={`text-xs ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>}
    </div>
  )
}
