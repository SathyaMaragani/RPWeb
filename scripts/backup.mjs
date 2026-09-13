#!/usr/bin/env node
/**
 * Exports every world from DATABASE_URL to files, then — if the output folder
 * is itself a git repository — commits and pushes them.
 *
 * The point is that the chat survives the database. A free Postgres plan can be
 * paused, expire, or change terms; a git repo is copied to GitHub and to every
 * machine that has ever cloned it.
 *
 * Files are overwritten in place on each run rather than timestamped, so the
 * folder stays small and git history carries every past version.
 *
 *   npm run backup                  -> writes ./backups
 *   npm run backup -- --out ../rp   -> writes elsewhere
 *   npm run backup -- --no-push     -> write and commit, but do not push
 *
 * NEVER point --out at a public repository.
 */
import { PrismaClient } from "@prisma/client"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, join } from "node:path"

const args = process.argv.slice(2)
const getFlag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null
}
const outDir = resolve(getFlag("out") ?? "backups")
const shouldPush = !args.includes("--no-push")

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Put it in .env or pass it in the environment.")
  process.exit(1)
}

const slugify = (v) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "world"

const escapeHtml = (v) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function renderHtml(world) {
  const rows = world.messages
    .map((m) => {
      const when = m.timestamp.toISOString().replace("T", " ").slice(0, 16)
      return `<article>
  <header><span class="who">${escapeHtml(m.character.name)}</span><time>${when}</time></header>
  <p>${escapeHtml(m.content).replace(/\n/g, "<br>")}</p>
</article>`
    })
    .join("\n")

  return `<!doctype html>
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
    ${escapeHtml(world.description || "")}${world.description ? "<br>" : ""}
    ${world.messages.length} messages &middot; ${world.members.length} members
  </div>
${rows}
</main>
</body>
</html>`
}

/** Runs git in `outDir`, returning stdout, or null if the command fails. */
function git(gitArgs) {
  try {
    return execFileSync("git", gitArgs, { cwd: outDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  } catch {
    return null
  }
}

const prisma = new PrismaClient()

try {
  const worlds = await prisma.world.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      members: { include: { character: true, user: { select: { id: true, name: true, email: true } } } },
      cast: { include: { character: true } },
      // deletedAt: a deleted message should not live on in the backup.
      messages: {
        where: { deletedAt: null },
        orderBy: { timestamp: "asc" },
        include: { character: true },
      },
    },
  })

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  let totalMessages = 0
  const summary = []

  for (const world of worlds) {
    const base = `${slugify(world.name)}-${world.id.slice(-6)}`
    totalMessages += world.messages.length

    const payload = {
      world: {
        id: world.id,
        name: world.name,
        description: world.description,
        inviteCode: world.inviteCode,
        createdAt: world.createdAt.toISOString(),
      },
      // The whole cast, not only the characters someone happens to play:
      // anyone in the world can write as any of them.
      characters: world.cast.map((entry) => {
        const playedBy = world.members.find((m) => m.characterId === entry.characterId)
        return {
          id: entry.character.id,
          name: entry.character.name,
          avatarUrl: entry.character.avatarUrl,
          color: entry.character.color,
          title: entry.character.title,
          bio: entry.character.bio,
          appearance: entry.character.appearance,
          role: playedBy?.role ?? null,
          playedBy: playedBy?.user.name ?? null,
        }
      }),
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

    writeFileSync(join(outDir, `${base}.json`), JSON.stringify(payload, null, 2), "utf8")
    writeFileSync(join(outDir, `${base}.html`), renderHtml(world), "utf8")

    summary.push(`- **${world.name}** — ${world.messages.length} messages, ${world.members.length} members (\`${base}\`)`)
    console.log(`  ${world.name}: ${world.messages.length} messages`)
  }

  writeFileSync(
    join(outDir, "README.md"),
    // No "last run" timestamp here on purpose: it would change on every run and
    // produce an empty commit each time, burying the real changes. The commit
    // date already records when each backup was taken.
    `# RPWeb backups\n\n` +
      `${worlds.length} worlds, ${totalMessages} messages total.\n\n` +
      `${summary.join("\n")}\n\n` +
      `Open any \`.html\` file in a browser to read it. The \`.json\` files hold every\n` +
      `field and can be re-imported.\n`,
    "utf8"
  )

  console.log(`\nWrote ${worlds.length} worlds (${totalMessages} messages) to ${outDir}`)

  if (!existsSync(join(outDir, ".git"))) {
    console.log(
      "\nThis folder is not a git repo, so nothing was committed.\n" +
        "To keep permanent history, clone a PRIVATE repo here — see BACKUPS.md."
    )
    process.exit(0)
  }

  const status = git(["status", "--porcelain"])
  if (status !== null && status.trim() === "") {
    console.log("\nNo changes since the last backup; nothing to commit.")
    process.exit(0)
  }

  git(["add", "-A"])
  const committed = git(["commit", "-m", `Backup ${new Date().toISOString().slice(0, 16).replace("T", " ")} — ${totalMessages} messages`])
  if (committed === null) {
    console.error("\nCommit failed. Is git configured (user.name / user.email) in that folder?")
    process.exit(1)
  }
  console.log("Committed.")

  if (!shouldPush) {
    console.log("Skipping push (--no-push).")
    process.exit(0)
  }

  if (git(["push"]) === null) {
    console.error(
      "\nCommit succeeded but push failed. The backup is safe locally; push it yourself when you can."
    )
    process.exit(1)
  }
  console.log("Pushed.")
} catch (error) {
  console.error("Backup failed:", error.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
