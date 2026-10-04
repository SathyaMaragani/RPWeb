import ImportCard from "./ImportCard"

export default function ImportCardPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 lg:mt-8">
      <div className="rounded-3xl border border-line bg-surface p-8 shadow-xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Import a character card</h1>
        <p className="mt-2 text-muted">
          Bring in a character from SillyTavern, Chub, Janitor and similar sites: a <code>.png</code> card or a{" "}
          <code>.json</code> file. Its picture, card fields and lorebook come with it.
        </p>
        <div className="mt-8">
          <ImportCard />
        </div>
      </div>
    </div>
  )
}
