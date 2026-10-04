import { Plus, Star, Trash2, VenetianMask } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/server/auth-guards"
import { createPersona, deletePersona, setDefaultPersona, updatePersona } from "@/server/actions/personas"
import { PageHeader } from "@/components/layout/PageHeader"
import { Avatar } from "@/components/layout/Sidebar"

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"

/** Name, picture and description, shared by the create and edit forms. */
function PersonaFields({ name = "", avatarUrl = "", description = "" }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink">
          Name
          <input name="name" required maxLength={80} defaultValue={name} className={input} />
        </label>
        <label className="block text-sm text-ink">
          Picture URL <span className="text-xs text-muted">(optional)</span>
          <input name="avatarUrl" type="url" defaultValue={avatarUrl} placeholder="https://..." className={input} />
        </label>
      </div>
      <label className="block text-sm text-ink">
        Who they are <span className="text-xs text-muted">(appearance, personality, background)</span>
        <textarea
          name="description"
          rows={4}
          maxLength={6000}
          defaultValue={description}
          placeholder="Tall, black hair, silver eyes. Quiet and analytical. Former royal guard."
          className={input}
        />
      </label>
    </>
  )
}

export default async function PersonasPage() {
  const userId = await requireUserId()
  const personas = await prisma.persona.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 lg:p-10">
      <PageHeader
        eyebrow="Personas"
        title="Your Personas"
        subtitle="Who you are in a story. AI characters are told about the persona you play."
      />

      <form action={createPersona} className="mb-8 space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Plus size={18} className="text-accent-soft" /> New persona
        </h2>
        <PersonaFields />
        <button className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-soft">
          Create persona
        </button>
      </form>

      {personas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
          <VenetianMask size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">No personas yet. Your first one becomes the default.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {personas.map((p) => (
            <li key={p.id}>
              <details className="group rounded-2xl border border-line bg-surface p-4 open:space-y-4">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <Avatar name={p.name} src={p.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      {p.name}
                      {p.isDefault && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-soft">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">{p.description || "No description yet."}</p>
                  </div>
                  <span className="text-xs text-muted group-open:hidden">Edit</span>
                </summary>

                <form action={updatePersona.bind(null, p.id)} className="space-y-4">
                  <PersonaFields name={p.name} avatarUrl={p.avatarUrl ?? ""} description={p.description ?? ""} />
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-soft">
                      Save
                    </button>
                    {!p.isDefault && (
                      <button
                        formAction={setDefaultPersona.bind(null, p.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink hover:border-accent/50"
                      >
                        <Star size={14} /> Make default
                      </button>
                    )}
                    <button
                      formAction={deletePersona.bind(null, p.id)}
                      formNoValidate
                      className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-muted hover:border-red-500/40 hover:text-red-400"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
