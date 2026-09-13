"use client"

import { usePathname } from "next/navigation"
import { isFullScreenPath } from "@/lib/routes"

/**
 * The scrolling region beside the sidebar.
 *
 * It knows about the route only to drop the bottom padding that makes room for
 * the mobile navigation, which full-screen pages hide.
 */
export function WorkspaceMain({ children }: { children: React.ReactNode }) {
  const fullScreen = isFullScreenPath(usePathname())

  return (
    <main
      className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${
        fullScreen ? "" : "pb-16 md:pb-0"
      }`}
    >
      {children}
    </main>
  )
}
