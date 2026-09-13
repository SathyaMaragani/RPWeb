const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
]

/** "2 hours ago", "yesterday", "just now". */
export function timeAgo(date: Date | string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.trunc(seconds / size), unit)
  }
  return "just now"
}

/** Whether `date` falls within the last `ms` milliseconds. */
export function isWithin(date: Date | string, ms: number) {
  return Date.now() - new Date(date).getTime() < ms
}
