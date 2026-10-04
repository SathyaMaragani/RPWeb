# Deploying RPWeb

Two free services: **Neon** for the database, **Vercel** for the app.

Free is not a guarantee from anyone. Set up [BACKUPS.md](BACKUPS.md) as well;
that is what actually makes the chat permanent.

---

## 1. Create the database (Neon)

1. Sign up at [neon.com](https://neon.com) and create a project.
2. Open **Connection Details** and copy **both** connection strings:

   | | Host contains | Used for |
   | --- | --- | --- |
   | **Pooled** | `-pooler` | The deployed app on Vercel |
   | **Direct** | no `-pooler` | Your machine: `prisma db push`, `npm run backup` |

This split matters. Vercel runs the app as many short-lived serverless
instances, each opening its own database connections; without the pooler, Neon
runs out of them. Prisma additionally needs `?pgbouncer=true` on a pooled URL,
because PgBouncer in transaction mode cannot keep Prisma's prepared statements
alive. Conversely, `prisma db push` needs a direct connection and will not work
through the pooler.

Free plan: 0.5 GB of storage — hundreds of thousands of messages of prose.

## 2. Create the schema

The build deliberately does **not** touch the database, so the schema is applied
from your machine. Put both URLs in `.env`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/rpweb"
PRODUCTION_DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
```

Then, whenever `prisma/schema.prisma` changes:

```bash
npm run db:push:prod
```

> **Run this before deploying the code that needs it.** Deploying a change that
> reads a column production does not have makes every page using it fail with a
> bare "server error" — the message is hidden in production builds, so it gives
> you nothing to go on. `npm run db:push` only touches your local database;
> `db:push:prod` is the one that reaches Neon.

## 3. Deploy the app (Vercel)

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repository. Vercel
   detects Next.js; the defaults are correct.
3. Add these **environment variables** before the first deploy:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the **pooled** Neon URL, plus `&pgbouncer=true&connect_timeout=15` |
   | `AUTH_SECRET` | a fresh random secret |

   `AUTH_SECRET` also encrypts the API keys people save for AI characters
   (Settings, AI models). Changing it makes those keys unreadable, and
   everyone has to paste their key again.

   Generate the secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Deploy.**

> **Paste the bare URL only.** Neon shows the string inside a ready-to-run
> `psql '...'` command; copying that whole line in is the most common way to
> break the build. The value must start with `postgresql://` — no `psql`
> prefix, no surrounding quotes. `scripts/check-env.mjs` runs first in the build
> and says so plainly if it is wrong.

`AUTH_TRUST_HOST` is not needed on Vercel — Auth.js recognises the platform, and
the app sets `trustHost: true` in [src/auth.ts](src/auth.ts) regardless. Leave
`NEXTAUTH_URL` unset unless you attach a custom domain.

## 4. Set up backups

Follow [BACKUPS.md](BACKUPS.md). Until that is done, the chat exists in exactly
one place.

---

## Why there is no realtime socket

The chat updates by **polling**, not WebSockets.

Vercel does not run custom servers, so the Socket.IO server this project used to
carry cannot be deployed there. Vercel's own WebSocket support (public beta
since June 2026) caps a connection at five minutes and would still need a shared
broker to fan a message out across serverless instances.

So the client asks the server for anything new instead, via the
`fetchMessagesSince` Server Action:

| Situation | Interval |
| --- | --- |
| Someone is writing | every 3s |
| Quiet for 2 minutes | every 15s |
| Quiet for 10 minutes | every 60s |
| Tab hidden | stopped entirely; resumes instantly when looked at again |

The backoff matters on a free plan: Neon suspends an idle database, and a
forgotten open tab polling every 3 seconds would hold it awake and eat the
monthly compute allowance for nothing.

The cost is that a partner's message appears within a few seconds rather than
instantly — imperceptible for prose roleplay.

## Troubleshooting

**`P1001: Can't reach database server`** — the connection did not open.

1. Neon was asleep and the connect timed out. Add `&connect_timeout=15` to the
   URL. This is the usual cause of an intermittent P1001.
2. Check the region in the hostname (`ap-southeast-1` is Singapore) against
   where the app runs. A mismatch adds latency to every query.

**`the URL must start with the protocol postgresql://`** — the value has a
`psql ` prefix or wrapping quotes. Paste only the URL.

**Sign-in fails with `UntrustedHost`** — `trustHost: true` is missing from
[src/auth.ts](src/auth.ts). Note that `NEXTAUTH_URL` does *not* satisfy Auth.js
here; only `AUTH_URL`, `AUTH_TRUST_HOST`, or a recognised platform does.

**Too many database connections** — the app is on Neon's direct endpoint.
Switch `DATABASE_URL` to the pooled host with `&pgbouncer=true`.

## Moving the database later

The app talks to plain PostgreSQL through Prisma, so switching providers is a
new `DATABASE_URL` plus `npm run db:push`. To carry the data across:

```bash
pg_dump "$OLD_DATABASE_URL" --no-owner --format=custom -f rpweb.dump
```

```bash
pg_restore --no-owner -d "$NEW_DATABASE_URL" rpweb.dump
```
