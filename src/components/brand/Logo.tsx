"use client"

import { useId } from "react"

/**
 * The RPWeb mark: two mirrored R's inside a ring, with a lit centre.
 *
 * Half the monogram is drawn once and mirrored, so the two letters cannot
 * drift out of symmetry, and the whole thing is inset inside the ring so the
 * legs do not collide with it.
 *
 * Gradient ids are made unique per instance: several of these render on the
 * same page, and shared ids would make every copy point at whichever set of
 * gradients happened to be first in the document.
 */
export function Logo({
  size = 28,
  className,
  title = "RPWeb",
}: {
  size?: number
  className?: string
  title?: string
}) {
  const uid = useId().replace(/:/g, "")
  const steel = `steel-${uid}`
  const ring = `ring-${uid}`
  const gem = `gem-${uid}`
  const glow = `glow-${uid}`
  const half = `half-${uid}`

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={steel} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#ececf8" />
          <stop offset="0.52" stopColor="#b6b6d6" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c8c8e6" />
        </linearGradient>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5cdff" />
          <stop offset="0.5" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#d5cdff" />
        </linearGradient>
        <radialGradient id={gem}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#6d47ff" />
        </radialGradient>
        <filter id={glow} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <g id={half} fill={`url(#${steel})`}>
          {/* Bowl: outer shape and its counter, cut with evenodd. */}
          <path
            fillRule="evenodd"
            d="M26.5 16 H17 C10.4 16 6 20 6 25.5 C6 31 10.4 35 17 35 H26.5 Z
               M26.5 21.8 H17.4 C14.4 21.8 12.6 23.3 12.6 25.5 C12.6 27.7 14.4 29.2 17.4 29.2 H26.5 Z"
          />
          <rect x="26.5" y="16" width="6" height="32" rx="0.8" />
          <path d="M26.5 32 L26.5 39.5 L15.4 48 L7.2 48 Z" />
        </g>
      </defs>

      <g filter={`url(#${glow})`}>
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke={`url(#${ring})`}
          strokeWidth="2.2"
          opacity="0.9"
        />
      </g>

      <g transform="translate(32 32) scale(0.84) translate(-32 -32)">
        <use href={`#${half}`} />
        <use href={`#${half}`} transform="translate(64,0) scale(-1,1)" />
        <g fill={`url(#${steel})`}>
          <path d="M32 6 L34.6 28 L32 31.2 L29.4 28 Z" />
          <path d="M32 58 L29.4 36 L32 32.8 L34.6 36 Z" />
        </g>
        <path d="M32 25.6 L37.4 32 L32 38.4 L26.6 32 Z" fill={`url(#${gem})`} />
      </g>
    </svg>
  )
}

/** The mark beside the name, for headers and sign-in. */
export function Wordmark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Logo size={size} />
      <span
        className="font-display font-semibold tracking-tight text-ink"
        style={{ fontSize: Math.round(size * 0.72) }}
      >
        RPWeb
      </span>
    </span>
  )
}
