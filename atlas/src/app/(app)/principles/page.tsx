import { createPrinciple, setPrincipleActive, updatePrinciple } from "@/lib/actions/principles";
import { getPrinciples } from "@/lib/queries";

export default async function PrinciplesPage() {
  const principles = await getPrinciples();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Principles</h1>
        <p className="text-sm text-muted">
          Rules and strategic beliefs that should influence future decisions. Visible to Atlas during AI analysis.
        </p>
      </div>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Add a principle</summary>
        <form action={createPrinciple} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Title</label>
            <input className="input" name="title" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Description</label>
            <textarea className="input" name="description" rows={2} />
          </div>
          <button type="submit" className="btn">
            Add
          </button>
        </form>
      </details>

      <div className="space-y-2">
        {principles.map((p) => (
          <div key={p.id} className={`card ${p.active ? "" : "opacity-60"}`}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.title}</span>
              {!p.active && <span className="badge">inactive</span>}
            </div>
            {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs link-quiet">Edit</summary>
              <div className="mt-3 space-y-3">
                <form action={updatePrinciple.bind(null, p.id)} className="space-y-2">
                  <input className="input" name="title" defaultValue={p.title} required />
                  <textarea className="input" name="description" rows={2} defaultValue={p.description ?? ""} />
                  <button type="submit" className="btn-secondary">
                    Save
                  </button>
                </form>
                <form action={setPrincipleActive.bind(null, p.id, !p.active)}>
                  <button type="submit" className="text-xs text-muted hover:text-ink">
                    {p.active ? "Mark inactive" : "Mark active"}
                  </button>
                </form>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
