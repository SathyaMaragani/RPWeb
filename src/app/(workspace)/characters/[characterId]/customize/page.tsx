import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireEditableCharacter, requireUserId } from "@/server/auth-guards"
import { DEFAULT_APPEARANCE, normalizeAppearance } from "@/lib/appearance"
import CharacterStudio from "./CharacterStudio"

export default async function CustomizeCharacterPage(
  props: PageProps<"/characters/[characterId]/customize">
) {
  const userId = await requireUserId()
  const { characterId } = await props.params

  const [allowed, character] = await Promise.all([
    requireEditableCharacter(userId, characterId).then(
      () => true,
      () => false
    ),
    prisma.character.findUnique({
      where: { id: characterId },
      select: { name: true, appearance: true },
    }),
  ])
  if (!allowed || !character) redirect("/characters")

  return (
    <CharacterStudio
      characterId={characterId}
      name={character.name}
      // Never designed: start from a dressed figure rather than a bare one.
      initial={character.appearance ? normalizeAppearance(character.appearance) : DEFAULT_APPEARANCE}
      hasSaved={character.appearance !== null}
    />
  )
}
