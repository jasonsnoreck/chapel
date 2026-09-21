import type { Asset, Business, EcosystemNodeType, EcosystemRelationship, ExternalEntity } from "@/lib/types";
import { createEcosystemRelationship } from "@/lib/actions/ecosystem";

const RELATIONSHIP_TYPES = [
  "supplier",
  "customer",
  "distributor",
  "shared_equipment",
  "shared_facility",
  "shared_labor",
  "lead_generation",
  "cross_sell",
  "capacity_utilization",
  "byproduct_utilization",
  "procurement_aggregation",
  "geographic_cluster",
  "complementary_service",
  "financing",
  "collateral",
  "strategic_dependency",
  "potential_conflict",
  "competitive",
  "replacement_opportunity",
  "external_dependency",
  "other",
] as const;

export default function EcosystemRelationshipsSection({
  nodeType,
  nodeId,
  relationships,
  businesses,
  assets,
  externalEntities,
  revalidatePathTarget,
}: {
  nodeType: EcosystemNodeType;
  nodeId: string;
  relationships: EcosystemRelationship[];
  businesses: Business[];
  assets: Asset[];
  externalEntities: ExternalEntity[];
  revalidatePathTarget: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Ecosystem relationships</h2>

      {relationships.length === 0 ? (
        <p className="text-sm text-muted">None recorded.</p>
      ) : (
        <div className="space-y-2">
          {relationships.map((r) => {
            const isFrom = r.from_type === nodeType && r.from_id === nodeId;
            return (
              <div key={r.id} className="card space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge">{r.relationship_type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted">{isFrom ? "→ outgoing" : "← incoming"}</span>
                  <span className="badge">{r.source === "ai_discovered" ? "AI" : "founder"}</span>
                  <span className="badge">{r.validation_status}</span>
                </div>
                {r.potential_effect && <p className="text-sm">{r.potential_effect}</p>}
                {r.evidence && <p className="text-xs text-muted">Evidence: {r.evidence}</p>}
              </div>
            );
          })}
        </div>
      )}

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Link a relationship</summary>
        <form action={createEcosystemRelationship.bind(null, nodeType, nodeId, revalidatePathTarget)} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Target type</label>
              <select className="input" name="to_type" defaultValue="business">
                <option value="business">Business</option>
                <option value="asset">Asset</option>
                <option value="external_entity">External entity</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Target</label>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Evidence</label>
            <textarea className="input" name="evidence" rows={2} />
          </div>
          <button type="submit" className="btn">
            Link
          </button>
        </form>
      </details>
    </div>
  );
}
