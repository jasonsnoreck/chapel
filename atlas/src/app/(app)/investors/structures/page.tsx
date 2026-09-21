import { redirect } from "next/navigation";
import { getFeatureFlag } from "@/lib/featureFlags";
import { getApprovedStructures, getProfessionalReviewsFor } from "@/lib/queries";
import { createApprovedStructure, createProfessionalReview, setStructureReviewStatus } from "@/lib/actions/investors";
import StructureStatusSelect from "@/components/StructureStatusSelect";

export default async function ApprovedStructuresPage() {
  const flag = await getFeatureFlag("investor_protocol_enabled");
  if (!flag?.enabled) redirect("/investors");

  const structures = await getApprovedStructures();
  const reviewsByStructure = await Promise.all(structures.map((s) => getProfessionalReviewsFor(s.id)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Approved structures</h1>
        <p className="text-sm text-muted">
          The app never invents or drafts a legal investment structure. This is a library the
          founder maintains for internal modeling — a structure is not "Approved" merely because
          it was created here; that requires a recorded professional review.
        </p>
      </div>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Add a structure</summary>
        <form action={createApprovedStructure} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Description</label>
            <textarea className="input" name="description" rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Required fields (comma separated)</label>
            <input className="input" name="required_fields" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Prohibited combinations</label>
            <textarea className="input" name="prohibited_combinations" rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Version</label>
            <input className="input" name="version" defaultValue="0.1" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
            <textarea className="input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn">
            Add structure
          </button>
        </form>
      </details>

      {structures.length === 0 ? (
        <p className="text-sm text-muted">No approved structures recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {structures.map((s, i) => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-muted">v{s.version}</span>
                </div>
                <StructureStatusSelect value={s.review_status} action={setStructureReviewStatus.bind(null, s.id)} />
              </div>
              {s.description && <p className="text-sm text-muted">{s.description}</p>}
              {s.required_fields.length > 0 && (
                <p className="text-xs text-muted">Required fields: {s.required_fields.join(", ")}</p>
              )}
              {s.prohibited_combinations && (
                <p className="text-xs text-muted">Prohibited: {s.prohibited_combinations}</p>
              )}

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted">Professional reviews</h3>
                {reviewsByStructure[i].length === 0 ? (
                  <p className="text-xs text-muted">None recorded.</p>
                ) : (
                  <div className="space-y-1">
                    {reviewsByStructure[i].map((r) => (
                      <div key={r.id} className="rounded-md bg-paper px-2 py-1.5 text-xs">
                        <span className="font-medium">{r.reviewer_name}</span> ({r.professional_type.replace("_", " ")}) —{" "}
                        {r.review_date} — <span className="badge">{r.approval_status.replace("_", " ")}</span>
                        {r.comments && <p className="mt-1 text-muted">{r.comments}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs link-quiet">Record a professional review</summary>
                  <form action={createProfessionalReview.bind(null, s.id)} className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" name="reviewer_name" placeholder="Reviewer name" required />
                      <select className="input" name="professional_type" defaultValue="attorney">
                        <option value="attorney">Attorney</option>
                        <option value="accountant">Accountant</option>
                        <option value="tax_advisor">Tax advisor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" name="review_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                      <select className="input" name="approval_status" defaultValue="pending">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="needs_revision">Needs revision</option>
                      </select>
                    </div>
                    <input className="input" name="document_reference" placeholder="Document/version reviewed" />
                    <textarea className="input" name="comments" rows={2} placeholder="Comments" />
                    <button type="submit" className="btn-secondary">
                      Record review
                    </button>
                  </form>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
