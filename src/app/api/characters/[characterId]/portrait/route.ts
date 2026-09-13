import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { BUST_VIEW, FULL_VIEW, composeSvg, normalizeAppearance } from "@/lib/appearance"

/**
 * Serves a designed character as SVG: head and shoulders by default, for
 * avatars, or the whole figure with `?view=full`.
 *
 * Public for the same reason as the avatar route: it is used as an `<img src>`
 * throughout the app, where an authenticated fetch cannot be expressed. The
 * markup is assembled from the built-in catalogue and validated colours only,
 * so nothing a user typed ever reaches it.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/characters/[characterId]/portrait">
) {
  const { characterId } = await ctx.params
  const params = new URL(request.url).searchParams

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { appearance: true },
  })
  if (!character?.appearance) return new NextResponse("Not found", { status: 404 })

  const view = params.get("view") === "full" ? FULL_VIEW : BUST_VIEW
  const svg = composeSvg(normalizeAppearance(character.appearance), view)

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // A versioned URL always draws the same design, so it caches hard.
      "Cache-Control": params.has("v") ? "public, max-age=31536000, immutable" : "no-cache",
      // Belt and braces for a document type that can carry script.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
