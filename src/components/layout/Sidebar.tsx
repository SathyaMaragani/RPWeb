"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Globe, Upload, Settings, LogOut } from "lucide-react"
import { signOutAction } from "@/server/actions/session"
import { isFullScreenPath } from "@/lib/routes"
import { Wordmark } from "@/components/brand/Logo"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/characters", label: "Characters", icon: Users },
  { href: "/worlds", label: "Worlds", icon: Globe },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
]

export type SidebarUser = {
  name: string
  avatarUrl: string | null
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  // Exact match or a child route, so "/worlds" does not stay lit on "/worldsfoo".
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  // The chat and the studio need the whole screen on a phone; their back
  // arrows are the way out, so nothing becomes unreachable.
  const hideMobileNav = isFullScreenPath(pathname)

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-line bg-gradient-to-b from-surface to-canvas">
        <div className="flex h-20 shrink-0 items-center px-5">
          <Wordmark size={38} />
        </div>

        {/* min-h-0 is what lets this shrink: a flex item defaults to
            min-height:auto and would otherwise refuse to go below its content,
            pushing the account block below the fold on a short window with
            nothing able to scroll to it. */}
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-to-r from-accent/30 to-accent/5 text-ink ring-1 ring-inset ring-accent/40 shadow-[0_0_20px_-8px_rgba(124,92,255,0.7)]"
                    : "text-muted hover:bg-elevated hover:text-ink"
                }`}
              >
                <item.icon size={18} className={active ? "text-accent-soft" : undefined} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-elevated/60 px-3 py-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{user.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
              </div>
            </div>
          </div>

          {/* A form, not a link: signing out changes state and must not happen
              on a GET that a prefetch could trigger. */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-red-400"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile */}
      <nav
        className={`${
          hideMobileNav ? "hidden" : "flex"
        } md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 items-center justify-around border-t border-line bg-surface px-2 pb-safe`}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 p-2 ${active ? "text-accent" : "text-muted"}`}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

/** Round avatar with an initial fallback, used wherever a face is shown. */
export function Avatar({
  name,
  src,
  size = 40,
  ring,
}: {
  name: string
  src?: string | null
  size?: number
  ring?: string
}) {
  const style = { width: size, height: size, ...(ring ? { boxShadow: `0 0 0 2px ${ring}` } : {}) }

  if (src) {
    return (
      // Avatars are arbitrary user-supplied URLs, so next/image's host
      // allowlist would reject most of them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <span
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-semibold text-muted"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
