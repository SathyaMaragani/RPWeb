import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId, requireWorldMembership } from "@/server/auth-guards"

export const dynamic = "force-dynamic"

/** Filename-safe slug for the downloaded file. */
function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "world"
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Downloads a complete copy of one world.
 *
 * Everything written in this app lives only in the database, and a free Render
 * Postgres instance is deleted 30 days after it is created with no backups, so
 * a self-serve export is the difference between keeping a story and losing it.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/worlds/[worldId]/export">) {
  const { worldId } = await ctx.params

  // Guards throw; translate them into real status codes so an unauthenticated
  // request gets a 401 rather than an opaque 500 and a logged stack trace.
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return new NextResponse("Sign in to export a world.", { status: 401 })
  }

  try {
    await requireWorldMembership(userId, worldId)
  } catch {
    return new NextResponse("You are not a member of this world.", { status: 403 })
  }

  const world = await prisma.world.findUnique({
    where: { id: worldId },
    include: {
      members: { include: { character: true, user: { select: { id: true, name: true } } } },
      // Exclude messages the writer deleted; an export should match the chat.
      messages: {
        where: { deletedAt: null },
        orderBy: { timestamp: "asc" },
        include: { character: true },
      },
    },
  })

  if (!world) {
    return new NextResponse("World not found", { status: 404 })
  }

  const format = request.nextUrl.searchParams.get("format") === "html" ? "html" : "json"
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `${slugify(world.name)}-${stamp}.${format}`

  if (format === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      world: {
        id: world.id,
        name: world.name,
        description: world.description,
        inviteCode: world.inviteCode,
        createdAt: world.createdAt.toISOString(),
      },
      characters: world.members.map((m) => ({
        id: m.character.id,
        name: m.character.name,
        avatarUrl: m.character.avatarUrl,
        bio: m.character.bio,
        appearance: m.character.appearance,
        role: m.role,
        playedBy: m.user.name,
      })),
      messages: world.messages.map((m) => ({
        id: m.id,
        character: m.character.name,
        characterId: m.characterId,
        content: m.content,
        format: m.format,
        isImported: m.isImported,
        timestamp: m.timestamp.toISOString(),
      })),
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  // A readable transcript that opens in any browser, with no dependency on
  // this app still existing.
  const rows = world.messages
    .map((m) => {
      const when = m.timestamp.toISOString().replace("T", " ").slice(0, 16)
      return `<article>
  <header><span class="who">${escapeHtml(m.character.name)}</span><time>${when}</time></header>
  <p>${escapeHtml(m.content).replace(/\n/g, "<br>")}</p>
</article>`
    })
    .join("\n")

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(world.name)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:2rem 1rem; background:#020617; color:#e2e8f0;
         font: 16px/1.7 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  main { max-width: 46rem; margin: 0 auto; }
  h1 { font-size: 1.9rem; margin: 0 0 .25rem; color: #fff; }
  .meta { color:#94a3b8; font-size:.875rem; margin-bottom:2.5rem; }
  article { border:1px solid #1e293b; background:#0f172a; border-radius:.9rem;
            padding:1rem 1.25rem; margin-bottom:.75rem; }
  header { display:flex; justify-content:space-between; align-items:baseline;
           gap:1rem; margin-bottom:.5rem; }
  .who { font-weight:700; color:#c7d2fe; }
  time { color:#64748b; font-size:.75rem; font-variant-numeric:tabular-nums; }
  p { margin:0; white-space:pre-wrap; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(world.name)}</h1>
  <div class="meta">
    ${escapeHtml(world.description || "")}
    ${world.description ? "<br>" : ""}
    ${world.messages.length} messages &middot; ${world.members.length} members &middot;
    exported ${stamp}
  </div>
${rows}
</main>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
