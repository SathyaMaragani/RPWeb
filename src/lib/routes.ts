/**
 * True for a single world's chat page, e.g. /worlds/abc123.
 *
 * Deliberately not `startsWith("/worlds/")`: /worlds/new and /worlds/join are
 * ordinary pages that should keep the mobile navigation. Only the chat itself
 * hides it, to give the conversation the whole screen on a phone.
 */
export function isWorldChatPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  return parts.length === 2 && parts[0] === "worlds" && !["new", "join"].includes(parts[1])
}

/**
 * Pages that take the whole phone screen and hide the bottom navigation: the
 * world chat, and the character studio, whose preview needs the height. Both
 * have their own back button.
 */
export function isFullScreenPath(pathname: string) {
  return isWorldChatPath(pathname) || /^\/characters\/[^/]+\/customize$/.test(pathname)
}
