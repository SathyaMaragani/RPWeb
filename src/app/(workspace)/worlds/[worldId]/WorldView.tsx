"use client"

import { useCallback, useState } from "react"
import ChatClient, { type ChatAi } from "./ChatClient"
import WorldHeader, { type WorldHeaderWorld } from "./WorldHeader"
import WorldInfoPanel, {
  type AddableCharacter,
  type PanelParticipant,
  type PanelWorld,
} from "./WorldInfoPanel"
import type { ComposerCharacter } from "./Composer"
import type { SerializedMessage } from "@/lib/messages"

/**
 * Owns the layout for a single world: header, chat, and the info panel.
 *
 * The message total lives here rather than in the chat, because the header and
 * the panel both display it and it changes as messages arrive.
 */
export default function WorldView({
  world,
  panelWorld,
  participants,
  addableCharacters,
  initialMessages,
  initialHasOlder,
  initialCursor,
  totalMessageCount,
  castCharacterIds,
  ownerCharacterIds,
  postAsCharacters,
  defaultCharacterId,
  importDate,
  ai,
}: {
  world: WorldHeaderWorld
  panelWorld: PanelWorld
  participants: PanelParticipant[]
  addableCharacters: AddableCharacter[]
  initialMessages: SerializedMessage[]
  initialHasOlder: boolean
  initialCursor: string
  totalMessageCount: number
  castCharacterIds: string[]
  ownerCharacterIds: string[]
  postAsCharacters: ComposerCharacter[]
  defaultCharacterId: string
  importDate: string | null
  ai: ChatAi
}) {
  const [messageCount, setMessageCount] = useState(totalMessageCount)
  // Stable identity, so the chat's reporting effect does not re-run every render.
  const handleCount = useCallback((n: number) => setMessageCount(n), [])

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <WorldHeader world={world} messageCount={messageCount} importDate={importDate} />
        <div className="min-h-0 flex-1">
          <ChatClient
            initialMessages={initialMessages}
            initialHasOlder={initialHasOlder}
            initialCursor={initialCursor}
            totalMessageCount={totalMessageCount}
            worldId={world.id}
            castCharacterIds={castCharacterIds}
            ownerCharacterIds={ownerCharacterIds}
            postAsCharacters={postAsCharacters}
            defaultCharacterId={defaultCharacterId}
            ai={ai}
            onCountChange={handleCount}
          />
        </div>
      </div>

      <WorldInfoPanel
        world={panelWorld}
        participants={participants}
        addableCharacters={addableCharacters}
        messageCount={messageCount}
      />
    </div>
  )
}
