import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAssets, getBusinesses } from "@/lib/queries";
import { getAllEcosystemRelationships, getExternalEntities } from "@/lib/queries-capital";
import {
  createEcosystemRelationshipGeneric,
  createExternalEntity,
  discoverEcosystemRelationships,
  setEcosystemRelationshipValidation,
} from "@/lib/actions/ecosystem";
import DiscoverRelationshipsButton from "@/components/DiscoverRelationshipsButton";

const RELATIONSHIP_TYPES = [
  "supplier", "customer", "distributor", "shared_equipment", "shared_facility", "shared_labor",
  "lead_generation", "cross_sell", "capacity_utilization", "byproduct_utilization",
  "procurement_aggregation", "geographic_cluster", "complementary_service", "financing",
  "collateral", "strategic_dependency", "potential_conflict", "competitive",
  "replacement_opportunity", "external_dependency", "other",
] as const;

function nodeLabel(
  type: string,
  id: string,
  businesses: { id: string; name: string }[],
  assets: { id: string; name: string }[],
  externalEntities: { id: string; name: string }[]
) {
  if (type === "business") return businesses.find((b) => b.id === id)?.name ?? "(unknown business)";
  if (type === "asset") return assets.find((a) => a.id === id)?.name ?? "(unknown asset)";
  if (type === "external_entity") return externalEntities.find((e) => e.id === id)?.name ?? "(unknown external entity)";
  return `${type}:${id}`;
}

export default async function EcosystemPage() {
  await requireCapitalEcosystemEnabled();

  const [relationships, businesses, assets, externalEntities] = await Promise.all([
    getAllEcosystemRelationships(),
    getBusinesses(),
    getAssets(),
    getExternalEntities(),
  ]);

  const proposed = relationships.filter((r) => r.validation_status === "proposed");
  const confirmed = relationships.filter((r) => r.validation_status === "confirmed");
  const other = relationships.filter((r) => r.validation_status === "rejected" || r.validation_status === "ignored");

  const label = (type: string, id: string) => nodeLabel(type, id, businesses, assets, externalEntities);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ecosystem</h1>
        <p className="text-sm text-muted">
          Relationships between things Atlas owns or is building — supplier/customer, shared
          capacity, conflicts, and more. Founder-entered facts and AI-discovered hypotheses live
          side by side here; AI candidates start as proposed and need your confirm/reject before
          they count as real.
        </p>
      </div>

      <section className="space-y-3">
        <DiscoverRelationshipsButton action={discoverEcosystemRelationships} />

        {proposed.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Proposed by AI — needs your review ({proposed.length})
            </h2>
            {proposed.map((r) => (
              <div key={r.id} className="card space-y-2 border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label(r.from_type, r.from_id)}</span>
                  <span className="badge">{r.relationship_type.replace(/_/g, " ")}</span>
                  <span className="font-medium">{label(r.to_type, r.to_id)}</span>
                  {r.confidence && <span className="badge">{r.confidence} confidence</span>}
                </div>
                {r.potential_effect && <p className="text-sm">{r.potential_effect}</p>}
                {r.evidence && <p className="text-xs text-muted">Evidence: {r.evidence}</p>}
                {r.assumptions && <p className="text-xs text-muted">Assumptions: {r.assumptions}</p>}
                {r.unknowns && <p className="text-xs text-muted">Unknowns: {r.unknowns}</p>}
                {r.notes && <p className="whitespace-pre-wrap text-xs text-muted">{r.notes}</p>}
                <div className="flex gap-2">
                  <form action={setEcosystemRelationshipValidation.bind(null, r.id, "confirmed")}>
                    <button className="badge hover:border-emerald-400 hover:text-emerald-700" type="submit">
                      Confirm
                    </button>
                  </form>
                  <form action={setEcosystemRelationshipValidation.bind(null, r.id, "rejected")}>
                    <button className="badge hover:border-red-400 hover:text-red-700" type="submit">
                      Reject
                    </button>
                  </form>
                  <form action={setEcosystemRelationshipValidation.bind(null, r.id, "ignored")}>
                    <button className="badge hover:border-accent hover:text-accent" type="submit">
                      Ignore for now
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">External entities</h2>
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">Add an external entity</summary>
          <form action={createExternalEntity} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Name</label>
              <input className="input" name="name" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Type</label>
              <select className="input" name="entity_type" defaultValue="company">
                <option value="company">Company</option>
                <option value="individual">Individual</option>
                <option value="marketplace">Marketplace</option>
                <option value="broker">Broker</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Add
            </button>
          </form>
        </details>
        {externalEntities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {externalEntities.map((e) => (
              <span key={e.id} className="badge">
                {e.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Confirmed relationships</h2>
        </div>
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">Link a relationship</summary>
          <form action={createEcosystemRelationshipGeneric} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">From type</label>
                <select className="input" name="from_type" defaultValue="business">
                  <option value="business">Business</option>
                  <option value="asset">Asset</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">From</label>
                <select className="input" name="from_id" defaultValue="" required>
                  <option value="" disabled>
                    Choose…
                  </option>
                  <optgroup label="Businesses">
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Assets">
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">To type</label>
                <select className="input" name="to_type" defaultValue="business">
                  <option value="business">Business</option>
                  <option value="asset">Asset</option>
                  <option value="external_entity">External entity</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">To</label>
                <select className="input" name="to_id" defaultValue="">
                  <option value="">Choose based on type above…</option>
                  <optgroup label="Businesses">
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Assets">
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="External entities">
                    {externalEntities.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Or name a new external entity</label>
              <input className="input" name="new_external_entity_name" placeholder="Leave blank unless linking to something outside Atlas" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Relationship type</label>
              <select className="input" name="relationship_type" defaultValue="supplier">
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Potential effect</label>
              <textarea className="input" name="potential_effect" rows={2} />
            </div>
            <button type="submit" className="btn">
              Link
            </button>
          </form>
        </details>

        {confirmed.length === 0 ? (
          <p className="text-sm text-muted">None recorded.</p>
        ) : (
          <div className="space-y-2">
            {confirmed.map((r) => (
              <div key={r.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label(r.from_type, r.from_id)}</span>
                  <span className="badge">{r.relationship_type.replace(/_/g, " ")}</span>
                  <span className="font-medium">{label(r.to_type, r.to_id)}</span>
                  <span className="badge">{r.source === "ai_discovered" ? "AI, confirmed" : "founder"}</span>
                </div>
                {r.potential_effect && <p className="text-sm text-muted">{r.potential_effect}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {other.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted">
            {other.length} rejected/ignored candidate(s)
          </summary>
          <div className="mt-2 space-y-1">
            {other.map((r) => (
              <div key={r.id} className="rounded-md bg-paper px-2 py-1.5 text-xs">
                {label(r.from_type, r.from_id)} → {r.relationship_type.replace(/_/g, " ")} → {label(r.to_type, r.to_id)} ({r.validation_status})
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
