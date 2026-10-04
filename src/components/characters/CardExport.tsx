"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cardToPngText, writePngText } from "@/lib/cards"
import { exportCharacterCard } from "@/server/actions/characters"

/** Card picture size: the 2:3 portrait most card sites expect. */
const CARD_W = 512
const CARD_H = 768

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Draws the character's picture onto a card-sized canvas, or a plain card if it can't be loaded. */
async function cardPicture(src: string | null, name: string, color: string): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#16141c"
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const drawFallback = () => {
    ctx.fillStyle = color
    ctx.font = "bold 220px serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(name.charAt(0).toUpperCase(), CARD_W / 2, CARD_H / 2)
  }

  if (src) {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("load"))
        img.src = src
      })
      // Cover the card, keeping the top of the picture (where faces are).
      const scale = Math.max(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight)
      const w = img.naturalWidth * scale
      ctx.drawImage(img, (CARD_W - w) / 2, 0, w, img.naturalHeight * scale)
      // A picture from another site without CORS taints the canvas; reading
      // it back would throw, so check now and fall back.
      ctx.getImageData(0, 0, 1, 1)
    } catch {
      ctx.fillStyle = "#16141c"
      ctx.fillRect(0, 0, CARD_W, CARD_H)
      drawFallback()
    }
  } else {
    drawFallback()
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not draw the card."))), "image/png")
  )
}

/** Download a character as a Tavern card, PNG or JSON. */
export default function CardExport({ characterId, name, color }: { characterId: string; name: string; color: string }) {
  const [busy, setBusy] = useState<"png" | "json" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const filename = name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "character"

  const run = async (format: "png" | "json") => {
    setBusy(format)
    setError(null)
    try {
      const { card, imageSrc } = await exportCharacterCard(characterId)
      if (format === "json") {
        download(new Blob([JSON.stringify(card, null, 2)], { type: "application/json" }), `${filename}.json`)
      } else {
        const picture = new Uint8Array(await (await cardPicture(imageSrc, name, color)).arrayBuffer())
        const png = writePngText(picture, "chara", cardToPngText(card))
        download(new Blob([png.buffer as ArrayBuffer], { type: "image/png" }), `${filename}.png`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export the card.")
    } finally {
      setBusy(null)
    }
  }

  const button =
    "inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink transition hover:border-accent/50 disabled:opacity-50"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Export card:</span>
      <button type="button" onClick={() => void run("png")} disabled={busy !== null} className={button}>
        {busy === "png" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PNG
      </button>
      <button type="button" onClick={() => void run("json")} disabled={busy !== null} className={button}>
        {busy === "json" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} JSON
      </button>
      {error && <span className="w-full text-xs text-red-400">{error}</span>}
    </div>
  )
}
