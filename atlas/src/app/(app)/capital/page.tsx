import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAssets, getBusinesses, getOpportunities, getProjects } from "@/lib/queries";
import {
  getAllCapitalNeeds,
  getAllMatchCandidates,
  getAvailabilityFor,
  getCapitalSources,
  latestAvailability,
} from "@/lib/queries-capital";
import { createCapitalNeed, createCapitalSource, setCapitalNeedStatus, setCapitalSourceStatus } from "@/lib/actions/capital";
import { createMatchCandidate, setMatchCandidateStatus } from "@/lib/actions/match";
import CapitalNeedStatusSelect from "@/components/CapitalNeedStatusSelect";
import CapitalSourceStatusSelect from "@/components/CapitalSourceStatusSelect";
import MatchCandidateStatusSelect from "@/components/MatchCandidateStatusSelect";

export default async function CapitalPage() {
  await requireCapitalEcosystemEnabled();

  const [needs, sources, matches, opportunities, projects, businesses, assets] = await Promise.all([
    getAllCapitalNeeds(),
    getCapitalSources(),
    getAllMatchCandidates(),
    getOpportunities(),
    getProjects(),
    getBusinesses(),
    getAssets(),
  ]);

  const availabilityBySource = new Map<string, number | null>();
  await Promise.all(
    sources.map(async (s) => {
      const rows = await getAvailabilityFor(s.id);
      availabilityBySource.set(s.id, latestAvailability(rows)?.amount_available ?? null);
    })
  );

  const targetLabel = (type: string, id: string) => {
    if (type === "opportunity") return opportunities.find((o) => o.id === id)?.title ?? "(deleted opportunity)";
    if (type === "project") return projects.find((p) => p.id === id)?.name ?? "(deleted project)";
    if (type === "business") return businesses.find((b) => b.id === id)?.name ?? "(deleted business)";
    if (type === "asset") return assets.find((a) => a.id === id)?.name ?? "(deleted asset)";
    return id;
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Capital</h1>
        <p className="text-sm text-muted">
          What Atlas's opportunities/projects/businesses/assets need, and what could supply it —
          an outside investor is only one kind of Capital Source among several.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Capital needs</h2>
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">Add a capital need</summary>
          <form action={createCapitalNeed} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Target</label>
              <select className="input" name="target" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                <optgroup label="Opportunities">
                  {opportunities.map((o) => (
                    <option key={o.id} value={`opportunity:${o.id}`}>
                      {o.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Projects">
                  {projects.map((p) => (
                    <option key={p.id} value={`project:${p.id}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Businesses">
                  {businesses.map((b) => (
                    <option key={b.id} value={`business:${b.id}`}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Assets">
                  {assets.map((a) => (
                    <option key={a.id} value={`asset:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Amount ($)</label>
                <input className="input" name="amount" type="number" step="0.01" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Timing</label>
                <input className="input" name="timing" placeholder="e.g. within 90 days" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Purpose</label>
              <input className="input" name="purpose" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Collateral requirements</label>
                <input className="input" name="collateral_requirements" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Repayment characteristics</label>
                <input className="input" name="repayment_characteristics" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Other constraints</label>
              <textarea className="input" name="other_constraints" rows={2} />
            </div>
            <button type="submit" className="btn">
              Add need
            </button>
          </form>
        </details>

        {needs.length === 0 ? (
          <p className="text-sm text-muted">No capital needs recorded.</p>
        ) : (
          <div className="space-y-2">
            {needs.map((n) => (
              <div key={n.id} className="card space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {targetLabel(n.target_type, n.target_id)} — {n.purpose || "capital need"}
                  </span>
                  <CapitalNeedStatusSelect value={n.status} action={setCapitalNeedStatus.bind(null, n.id)} />
                </div>
                <p className="text-sm text-muted">
                  {n.amount ? `$${n.amount.toLocaleString()}` : "Amount not set"}
                  {n.timing ? ` · ${n.timing}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Capital sources</h2>
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">Add a capital source</summary>
          <form action={createCapitalSource} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Type</label>
                <select className="input" name="capital_source_type" defaultValue="other">
                  <option value="atlas_equity">Atlas equity</option>
                  <option value="investor_mandate">Investor mandate</option>
                  <option value="seller_financing">Seller financing</option>
                  <option value="bank_debt">Bank debt</option>
                  <option value="sba_debt">SBA debt</option>
                  <option value="equipment_financing">Equipment financing</option>
                  <option value="internal_cashflow">Internal cash flow (an Atlas business)</option>
                  <option value="atlas_business">Atlas business (as source)</option>
                  <option value="atlas_asset">Atlas asset (as source)</option>
                  <option value="strategic_partner">Strategic partner</option>
                  <option value="customer_prepayment">Customer prepayment</option>
                  <option value="contributed_resources">Contributed resources</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input className="input" name="name" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                If this source IS an existing Atlas business/asset
              </label>
              <select className="input" name="linked_source" defaultValue="">
                <option value="">Not linked to an existing Atlas record</option>
                <optgroup label="Businesses">
                  {businesses.map((b) => (
                    <option key={b.id} value={`business:${b.id}`}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Assets">
                  {assets.map((a) => (
                    <option key={a.id} value={`asset:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Amount available now ($, optional)</label>
              <input className="input" name="amount_available" type="number" step="0.01" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
              <textarea className="input" name="notes" rows={2} />
            </div>
            <button type="submit" className="btn">
              Add source
            </button>
          </form>
        </details>

        {sources.length === 0 ? (
          <p className="text-sm text-muted">No capital sources recorded.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="card space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.name || s.capital_source_type.replace(/_/g, " ")}</span>
                  <CapitalSourceStatusSelect value={s.status} action={setCapitalSourceStatus.bind(null, s.id)} />
                </div>
                <p className="text-sm text-muted">
                  {s.capital_source_type.replace(/_/g, " ")}
                  {availabilityBySource.get(s.id) != null ? ` · $${availabilityBySource.get(s.id)!.toLocaleString()} available` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Match candidates</h2>
        <p className="text-xs text-muted">
          Compatibility analysis between a capital need and a capital source — never an approval.
          Real approval still runs through Decisions, Approved Structures, and Professional
          Review, unchanged.
        </p>

        {needs.length > 0 && sources.length > 0 && (
          <details className="card">
            <summary className="cursor-pointer text-sm font-medium">Record a match candidate</summary>
            <form action={createMatchCandidate} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Capital need</label>
                <select className="input" name="capital_need_id" required defaultValue="">
                  <option value="" disabled>
                    Choose…
                  </option>
                  {needs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {targetLabel(n.target_type, n.target_id)} — {n.purpose || "capital need"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Capital source</label>
                <select className="input" name="capital_source_id" required defaultValue="">
                  <option value="" disabled>
                    Choose…
                  </option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.capital_source_type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Compatible dimensions (one per line)</label>
                <textarea className="input" name="compatible_dimensions" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Conflicting dimensions (one per line)</label>
                <textarea className="input" name="conflicting_dimensions" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Unknown dimensions (one per line)</label>
                <textarea className="input" name="unknown_dimensions" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Questions for founder</label>
                <textarea className="input" name="questions_for_founder" rows={2} />
              </div>
              <button type="submit" className="btn">
                Record
              </button>
            </form>
          </details>
        )}

        {matches.length === 0 ? (
          <p className="text-sm text-muted">No match candidates recorded.</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const need = needs.find((n) => n.id === m.capital_need_id);
              const source = sources.find((s) => s.id === m.capital_source_id);
              return (
                <div key={m.id} className="card space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {need ? targetLabel(need.target_type, need.target_id) : "?"} ↔ {source?.name || source?.capital_source_type.replace(/_/g, " ") || "?"}
                    </span>
                    <MatchCandidateStatusSelect value={m.status} action={setMatchCandidateStatus.bind(null, m.id)} />
                  </div>
                  {m.compatible_dimensions.length > 0 && (
                    <p className="text-xs text-emerald-700">Compatible: {m.compatible_dimensions.join(", ")}</p>
                  )}
                  {m.conflicting_dimensions.length > 0 && (
                    <p className="text-xs text-red-700">Conflicting: {m.conflicting_dimensions.join(", ")}</p>
                  )}
                  {m.unknown_dimensions.length > 0 && (
                    <p className="text-xs text-muted">Unknown: {m.unknown_dimensions.join(", ")}</p>
                  )}
                  {m.questions_for_founder && <p className="text-sm">{m.questions_for_founder}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
