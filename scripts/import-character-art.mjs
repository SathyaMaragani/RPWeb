// Imports externally drawn character artwork into the appearance catalogue.
//
//   node scripts/import-character-art.mjs [--src art/characters] [--out src/lib/appearance/assets/imported.ts]
//
// Layout: <src>/<slot>/<asset-id>/asset.json plus one SVG per layer, named after
// the layer (hairBack.svg, hairFront.svg, torso.svg, ...). Every SVG uses the
// 1024 × 1536 canvas and the standard pose. Recolourable regions are painted in
// the key colours listed in CHARACTER_ART.md and become colour tokens here.
// See CHARACTER_ART.md for the full specification.

import fs from "node:fs"
import path from "node:path"

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), [])
)
const SRC = args.src ?? "art/characters"
const OUT = args.out ?? "src/lib/appearance/assets/imported.ts"

const LAYERS = ["back", "hairBack", "body", "legs", "feet", "torso", "vest", "waist", "outer", "gloves", "neck", "head", "face", "ears", "eyewear", "hairFront", "horns", "headwear", "hand"]
const SLOTS = ["body", "ears", "face", "markings", "eyes", "eyebrows", "mouth", "hair", "hairAccessory", "top", "bottom", "dress", "vest", "belt", "coat", "gloves", "shoes", "glasses", "mask", "earrings", "necklace", "bracelets", "hat", "weapon", "animalEars", "horns", "halo", "wings", "tail"]

// Key colours an artist paints with, and the token each becomes.
const KEYS = {
  primary: ["#ff0000", "#cc0000", "#990000", "#ff8080", "#4d0000"],
  secondary: ["#00ff00", "#00cc00", "#009900", "#80ff80", "#004d00"],
  trim: ["#0000ff", "#0000cc", "#000099", "#8080ff", "#00004d"],
  skin: ["#ffcc99", "#e6a870", "#b37d4d", "#ffe6cc", "#663d1f"],
  hair: ["#ff00ff", "#cc00cc", "#990099", "#ff80ff", "#4d004d"],
  eyes: ["#00ffff", "#00cccc", "#009999", "#80ffff", "#004d4d"],
}
const VARIANTS = ["", "Shade", "Deep", "Light", "Line"]
const TOKEN_FOR = new Map(
  Object.entries(KEYS).flatMap(([base, hexes]) => hexes.map((hex, i) => [hex, `{{${base}${VARIANTS[i]}}}`]))
)

const fail = (where, message) => {
  console.error(`✗ ${where}: ${message}`)
  process.exitCode = 1
}

function readLayer(file, prefix) {
  let svg = fs.readFileSync(file, "utf8")

  const viewBox = /<svg[^>]*\sviewBox="([^"]+)"/i.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number).join(" ")
  if (viewBox !== "0 0 1024 1536") throw new Error(`viewBox must be "0 0 1024 1536" (found ${viewBox ?? "none"})`)

  // Active or external content could run or leak when a portrait is served.
  if (/<script|<foreignObject|\son[a-z]+\s*=|(?:xlink:)?href\s*=\s*"(?!#|data:image\/(?:png|webp|jpeg);)/i.test(svg)) {
    throw new Error("contains scripts, event handlers, foreignObject or external references")
  }

  svg = svg
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<sodipodi:[\s\S]*?(?:\/>|<\/sodipodi:[^>]+>)/gi, "")
    .replace(/\s(?:inkscape|sodipodi):[\w-]+="[^"]*"/gi, "")
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/i.exec(svg)?.[1]
  if (inner === undefined) throw new Error("no <svg> element")

  // Ids are prefixed so they cannot collide with any other asset in a portrait.
  const ids = [...inner.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
  let out = inner
  for (const id of ids) {
    out = out
      .split(`id="${id}"`).join(`id="${prefix}-${id}"`)
      .split(`url(#${id})`).join(`url(#${prefix}-${id})`)
      .split(`href="#${id}"`).join(`href="#${prefix}-${id}"`)
  }

  // Key colours become tokens, wherever they appear (attributes or style).
  return out.replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, (hex) => {
    const full = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex
    return TOKEN_FOR.get(full.toLowerCase()) ?? hex
  }).replace(/\s+/g, " ").trim()
}

const assets = []
if (fs.existsSync(SRC)) {
  for (const slot of fs.readdirSync(SRC)) {
    const slotDir = path.join(SRC, slot)
    if (!fs.statSync(slotDir).isDirectory()) continue
    if (!SLOTS.includes(slot)) {
      fail(slotDir, `unknown slot "${slot}"`)
      continue
    }
    for (const id of fs.readdirSync(slotDir)) {
      const dir = path.join(slotDir, id)
      if (!fs.statSync(dir).isDirectory()) continue
      try {
        if (!/^[a-z0-9_]+$/.test(id)) throw new Error("asset folder names use a-z, 0-9 and _ only")
        const meta = JSON.parse(fs.readFileSync(path.join(dir, "asset.json"), "utf8"))
        if (typeof meta.name !== "string" || !meta.name) throw new Error('asset.json needs a "name"')

        const layers = {}
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
          const layer = path.basename(file, ".svg")
          if (!LAYERS.includes(layer)) throw new Error(`${file}: "${layer}" is not a layer`)
          layers[layer] = readLayer(path.join(dir, file), `${slot}-${id}-${layer}`)
        }
        if (Object.keys(layers).length === 0) throw new Error("no layer SVGs")

        const painted = Object.values(layers).join("")
        const colors = {}
        for (const key of ["primary", "secondary", "trim"]) {
          const used = painted.includes(`{{${key}`)
          const given = meta.colors?.[key]
          if (used && !/^#[0-9a-f]{6}$/i.test(given ?? "")) throw new Error(`paints ${key} but asset.json gives no starting colour for it`)
          if (used) colors[key] = given.toLowerCase()
        }

        assets.push({
          id,
          name: meta.name,
          slot,
          layers,
          ...(Object.keys(colors).length ? { colors } : {}),
          ...(meta.metal ? { metal: true } : {}),
          ...(slot === "body" && typeof meta.widthScale === "number" ? { widthScale: meta.widthScale } : {}),
        })
        console.log(`✓ ${slot}/${id} (${Object.keys(layers).join(", ")})`)
      } catch (error) {
        fail(dir, error.message)
      }
    }
  }
}

if (process.exitCode) {
  console.error("Nothing written: fix the errors above.")
} else {
  fs.writeFileSync(
    OUT,
    `// Generated by scripts/import-character-art.mjs from ${SRC.replace(/\\/g, "/")}. Do not edit.\n` +
      `import type { Asset } from "../core"\n\n` +
      `export const IMPORTED_ASSETS: Asset[] = ${JSON.stringify(assets, null, 2)}\n`
  )
  console.log(`${assets.length} imported asset${assets.length === 1 ? "" : "s"} written to ${OUT}`)
}
