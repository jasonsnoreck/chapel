import { createDecision } from "@/lib/actions/decisions";
import { getBusinesses, getOpportunities, getProjects } from "@/lib/queries";

export default async function NewDecisionPage({
  searchParams,
}: {
  searchParams: { opportunity_id?: string; project_id?: string; business_id?: string };
}) {
  const [opportunities, projects, businesses] = await Promise.all([
    getOpportunities(),
    getProjects(),
    getBusinesses(),
  ]);

  const returnTo = searchParams.opportunity_id
    ? `/opportunities/${searchParams.opportunity_id}`
    : searchParams.project_id
      ? `/projects/${searchParams.project_id}`
      : "/decisions";

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Record a decision</h1>
      <form action={createDecision} className="card space-y-4">
        <input type="hidden" name="return_to" value={returnTo} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Subject</label>
          <input className="input" name="subject" required placeholder="What is this decision about?" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Decision</label>
          <textarea className="input" name="decision" rows={2} required placeholder="e.g. Do not pursue this acquisition." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Reasoning</label>
          <textarea className="input" name="reasoning" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Decided on</label>
            <input className="input" name="decided_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Review date (optional)</label>
            <input className="input" name="review_date" type="date" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Related opportunity</label>
          <select className="input" name="opportunity_id" defaultValue={searchParams.opportunity_id ?? ""}>
            <option value="">None</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Related project</label>
          <select className="input" name="project_id" defaultValue={searchParams.project_id ?? ""}>
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {businesses.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Related business</label>
            <select className="input" name="business_id" defaultValue={searchParams.business_id ?? ""}>
              <option value="">None</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="btn">
          Record decision
        </button>
      </form>
    </div>
  );
}
