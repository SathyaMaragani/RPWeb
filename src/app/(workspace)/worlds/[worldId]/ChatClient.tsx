"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, CloudOff, Sparkles } from "lucide-react"
import {
  createMessage,
  editMessage,
  deleteMessage,
  selectSwipe,
  fetchChangesSince,
  fetchOlderMessages,
} from "@/server/actions/messages"
import type { SerializedMessage } from "@/lib/messages"
import MessageItem from "./MessageItem"
import Composer, { type ComposerCharacter } from "./Composer"
import AiBar, { type AiCastMember, type AiPersona, type AiWorldSettings } from "./AiBar"
import { generateReply } from "@/server/actions/ai"
import { branchWorld } from "@/server/actions/worlds"
import { useRouter } from "next/navigation"

export type ChatAi = {
  cast: AiCastMember[]
  personas: AiPersona[]
  hasModel: boolean
  settings: AiWorldSettings
}

/**
 * How often to ask the server what changed.
 *
 * There is no socket: the app runs on a platform with no long-lived process,
 * so the chat pulls. The interval widens the longer nothing happens, which
 * keeps a forgotten open tab from holding a scale-to-zero database awake and
 * burning a free compute allowance. Polling stops entirely while the tab is
 * hidden and resumes the moment it is looked at again.
 */
const POLL_ACTIVE_MS = 3_000
const POLL_IDLE_MS = 15_000
const POLL_DORMANT_MS = 60_000
const IDLE_AFTER_MS = 2 * 60_000
const DORMANT_AFTER_MS = 10 * 60_000

/** Merges rows in by id — new ones added, existing ones replaced when changed. */
function mergeMessages(existing: SerializedMessage[], incoming: SerializedMessage[]) {
  if (!incoming.length) return existing
  const byId = new Map(existing.map((m) => [m.id, m]))
  let changed = false
  for (const m of incoming) {
    const prev = byId.get(m.id)
    if (!prev || prev.updatedAt !== m.updatedAt) {
      byId.set(m.id, m)
      changed = true
    }
  }
  if (!changed) return existing
  return [...byId.values()].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

export default function ChatClient({
  initialMessages,
  initialHasOlder,
  initialCursor,
  totalMessageCount,
  worldId,
  castCharacterIds,
  ownerCharacterIds,
  postAsCharacters,
  defaultCharacterId,
  ai,
  onCountChange,
}: {
  initialMessages: SerializedMessage[]
  initialHasOlder: boolean
  initialCursor: string
  totalMessageCount: number
  worldId: string
  castCharacterIds: string[]
  ownerCharacterIds: string[]
  postAsCharacters: ComposerCharacter[]
  defaultCharacterId: string
  ai: ChatAi
  /** Reports the live world total so the header and info panel can show it. */
  onCountChange?: (count: number) => void
}) {
  const [messages, setMessages] = useState<SerializedMessage[]>(initialMessages)
  const [activeCharacterId, setActiveCharacterId] = useState(defaultCharacterId)
  const [hasOlder, setHasOlder] = useState(initialHasOlder)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [syncFailing, setSyncFailing] = useState(false)
  const router = useRouter()
  const [writing, setWriting] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState(ai.personas.find((p) => p.isDefault)?.id ?? "")

  // Messages older than the loaded window, so the world total can be derived
  // rather than incremented — which stays correct however a message arrives.
  const [olderNotLoaded, setOlderNotLoaded] = useState(
    Math.max(0, totalMessageCount - initialMessages.length)
  )

  const messageCount = olderNotLoaded + messages.length
  useEffect(() => {
    onCountChange?.(messageCount)
  }, [messageCount, onCountChange])

  const cursorRef = useRef(initialCursor)
  const lastChangeRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  // The message the "New messages" divider sits above. State, not a ref:
  // it is read while rendering, and a ref read during render is not safe.
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null)

  // Anything in the cast can be edited or removed by any member — the story is
  // shared, and so is responsibility for it.
  const mine = new Set(castCharacterIds)
  const owners = new Set(ownerCharacterIds)

  /** Pulls everything changed since the cursor: new, edited and deleted. */
  const sync = useCallback(async () => {
    try {
      const res = await fetchChangesSince(worldId, cursorRef.current)
      cursorRef.current = res.cursor

      if (res.messages.length || res.deletedIds.length) {
        lastChangeRef.current = Date.now()
        if (res.messages.length) {
          // Only the first batch after opening marks the boundary.
          setFirstUnreadId((current) => current ?? res.messages[0].id)
        }
        setMessages((prev) => {
          const merged = mergeMessages(prev, res.messages)
          if (!res.deletedIds.length) return merged
          const gone = new Set(res.deletedIds)
          return merged.filter((m) => !gone.has(m.id))
        })
      }
      setSyncFailing(false)
    } catch (error) {
      console.error("Failed to sync messages", error)
      setSyncFailing(true)
    }
  }, [worldId])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    lastChangeRef.current = Date.now()

    const delay = () => {
      const quiet = Date.now() - lastChangeRef.current
      if (quiet > DORMANT_AFTER_MS) return POLL_DORMANT_MS
      if (quiet > IDLE_AFTER_MS) return POLL_IDLE_MS
      return POLL_ACTIVE_MS
    }

    const tick = async () => {
      if (cancelled) return
      // A hidden tab has nobody reading it; skip the query rather than keeping
      // the database awake for nothing.
      if (document.visibilityState === "visible") await sync()
      if (!cancelled) timer = setTimeout(tick, delay())
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      if (timer) clearTimeout(timer)
      void tick()
    }

    document.addEventListener("visibilitychange", onVisible)
    timer = setTimeout(tick, POLL_ACTIVE_MS)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [sync])

  // Only pin to the bottom when the reader is already there, so loading older
  // messages or reading back does not yank them away.
  useEffect(() => {
    if (stickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140
  }

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return
    setLoadingOlder(true)
    const el = scrollRef.current
    const previousHeight = el?.scrollHeight ?? 0
    try {
      const { messages: older, hasMore } = await fetchOlderMessages(worldId, messages[0].timestamp)
      setHasOlder(hasMore)
      if (older.length) {
        setOlderNotLoaded((n) => Math.max(0, n - older.length))
        stickToBottomRef.current = false
        setMessages((prev) => mergeMessages(older, prev))
        // Hold the reader's place instead of jumping to the top.
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - previousHeight
        })
      }
    } catch (error) {
      console.error("Failed to load older messages", error)
    } finally {
      setLoadingOlder(false)
    }
  }

  const send = async (content: string) => {
    stickToBottomRef.current = true
    // Stored as MIXED: the kinds live in the markers inside the text, so one
    // post can hold speech, action and thought at once.
    const saved = await createMessage(worldId, content, "MIXED", activeCharacterId)
    lastChangeRef.current = Date.now()
    // Keep the cursor ahead of our own write so the next poll does not
    // re-deliver it as though it were news.
    if (saved.updatedAt > cursorRef.current) cursorRef.current = saved.updatedAt
    setMessages((prev) => mergeMessages(prev, [saved]))
  }

  /** Keeps polling quick after a change, so the other person's reply arrives soon. */
  const markActive = useCallback(() => {
    lastChangeRef.current = Date.now()
  }, [])

  /** Has the AI write a character's next message, or rewrite the latest one. */
  const runAi = async (characterId: string, regenerateMessageId?: string) => {
    if (writing) return
    setWriting(characterId)
    setAiError(null)
    stickToBottomRef.current = true
    try {
      const res = await generateReply(worldId, characterId, {
        personaId,
        regenerateMessageId: regenerateMessageId ?? null,
      })
      if (!res.ok) {
        setAiError(res.error)
        return
      }
      markActive()
      if (res.message.updatedAt > cursorRef.current) cursorRef.current = res.message.updatedAt
      setMessages((prev) => mergeMessages(prev, [res.message]))
    } catch {
      setAiError("Could not reach the server. Try again.")
    } finally {
      setWriting(null)
    }
  }

  const swipeTo = async (id: string, index: number) => {
    setAiError(null)
    try {
      const saved = await selectSwipe(id, index)
      if (saved.updatedAt > cursorRef.current) cursorRef.current = saved.updatedAt
      setMessages((prev) => mergeMessages(prev, [saved]))
    } catch {
      setAiError("Could not switch versions. Try again.")
    }
  }

  /** Copies the story up to a message into a new world, leaving this one alone. */
  const branchFrom = async (id: string) => {
    if (!window.confirm("Start a new world with the story up to this message? This world stays exactly as it is.")) return
    setAiError(null)
    try {
      const { worldId: branchId } = await branchWorld(id)
      router.push(`/worlds/${branchId}`)
    } catch {
      setAiError("Could not create the branch. Try again.")
    }
  }

  const applyEdit = async (id: string, content: string) => {
    const saved = await editMessage(id, content)
    if (saved.updatedAt > cursorRef.current) cursorRef.current = saved.updatedAt
    setMessages((prev) => mergeMessages(prev, [saved]))
  }

  const applyDelete = async (id: string) => {
    await deleteMessage(id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
      >
        <div className="mx-auto max-w-4xl">
          {hasOlder && (
            <div className="flex justify-center pb-2">
              <button
                onClick={loadOlder}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-muted transition hover:text-ink disabled:opacity-50"
              >
                {loadingOlder && <Loader2 size={13} className="animate-spin" />}
                {loadingOlder ? "Loading..." : "Load earlier messages"}
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Sparkles size={28} className="mb-3 text-accent" />
              <p className="text-lg font-medium text-ink">Nothing written yet.</p>
              <p className="mt-1 text-sm text-muted">Set the scene below to begin.</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const prev = messages[i - 1]
            const showHeader = !prev || prev.character.id !== msg.character.id
            const unreadBoundary = firstUnreadId === msg.id && i > 0

            return (
              <div key={msg.id}>
                {unreadBoundary && (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      New messages
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <MessageItem
                  message={msg}
                  showHeader={showHeader}
                  isOwner={owners.has(msg.character.id)}
                  canManage={mine.has(msg.character.id)}
                  onEdit={applyEdit}
                  onDelete={applyDelete}
                  onBranch={(id) => void branchFrom(id)}
                  onRegenerate={
                    msg.aiGenerated && i === messages.length - 1 && !writing
                      ? () => void runAi(msg.character.id, msg.id)
                      : undefined
                  }
                  onSwipe={
                    msg.aiGenerated && i === messages.length - 1 && !writing
                      ? (index) => void swipeTo(msg.id, index)
                      : undefined
                  }
                />
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {syncFailing && (
        <div className="flex items-center justify-center gap-2 border-t border-line bg-amber-500/10 py-1.5 text-xs font-medium text-amber-400">
          <CloudOff size={13} /> Not syncing — retrying
        </div>
      )}

      <AiBar
        worldId={worldId}
        cast={ai.cast}
        personas={ai.personas}
        hasModel={ai.hasModel}
        settings={ai.settings}
        writing={writing}
        error={aiError}
        onAsk={(id) => void runAi(id)}
        personaId={personaId}
        onPersonaChange={setPersonaId}
      />

      <Composer
        characters={postAsCharacters}
        activeCharacterId={activeCharacterId}
        onChangeCharacter={setActiveCharacterId}
        onSend={send}
      />
    </div>
  )
}
