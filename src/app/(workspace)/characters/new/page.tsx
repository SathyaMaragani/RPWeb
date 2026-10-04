import { createCharacter } from "@/server/actions/characters"
import CharacterForm, { EMPTY_CHARACTER } from "@/components/characters/CharacterForm"

export default function NewCharacterPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 lg:mt-8">
      <div className="rounded-3xl border border-line bg-surface p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Who are you in this universe?
        </h1>
        <p className="mt-2 text-muted">
          Give them a face and a colour — everyone in the world sees the same one.
        </p>

        <div className="mt-8">
          <CharacterForm
            action={createCharacter}
            submitLabel="Create Character"
            defaults={EMPTY_CHARACTER}
          />
        </div>
      </div>
    </div>
  )
}
