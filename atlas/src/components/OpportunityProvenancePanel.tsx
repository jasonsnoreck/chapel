import type { DiligenceItem, OpportunityProvenance } from "@/lib/types";
import { addDiligenceItem, setDiligenceItemStatus, upsertOpportunityProvenance } from "@/lib/actions/provenance";
import DiligenceItemStatusSelect from "@/components/DiligenceItemStatusSelect";

const DISCOVERY_CHANNELS = [
  "marketplace", "broker", "public_web", "direct_submission", "referral",
  "public_records", "founder", "ai_ecosystem_discovery", "other",
] as const;
const INFORMATION_TIERS = ["discovery", "screening", "diligence"] as const;
const DILIGENCE_ITEM_TYPES = [
  "pnl", "balance_sheet", "tax_return", "lease", "customer_concentration",
  "equipment_list", "payroll", "debt_schedule", "contracts", "inventory",
  "seller_disclosure", "other",
] as const;

export default function OpportunityProvenancePanel({
  opportunityId,
  provenance,
  diligenceItems,
}: {
  opportunityId: string;
  provenance: OpportunityProvenance | null;
  diligenceItems: DiligenceItem[];
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Where this came from</h2>
        {provenance ? (
          <div className="card space-y-1 text-sm">
            <p>
              <span className="font-medium">{provenance.discovery_channel.replace(/_/g, " ")}</span>
              {" · "}
              <span className="badge">{provenance.information_tier}</span>
              {provenance.still_available === false && <span className="badge ml-1">no longer available</span>}
            </p>
            <p className="text-xs text-muted">
              First discovered {new Date(provenance.first_discovered_at).toLocaleDateString()} · last observed{" "}
              {new Date(provenance.last_observed_at).toLocaleDateString()}
            </p>
            {provenance.source_url && (
              <p className="text-xs">
                <a className="link-quiet" href={provenance.source_url} target="_blank" rel="noreferrer">
                  {provenance.source_url}
                </a>
              </p>
            )}
            {provenance.source_reference && <p className="text-xs text-muted">Ref: {provenance.source_reference}</p>}
            {provenance.notes && <p className="text-xs text-muted">{provenance.notes}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted">No provenance recorded yet.</p>
        )}

        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">
            {provenance ? "Update provenance" : "Record provenance"}
          </summary>
          <form action={upsertOpportunityProvenance.bind(null, opportunityId)} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Discovery channel</label>
                <select className="input" name="discovery_channel" defaultValue={provenance?.discovery_channel ?? "founder"}>
                  {DISCOVERY_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Information tier</label>
                <select className="input" name="information_tier" defaultValue={provenance?.information_tier ?? "discovery"}>
                  {INFORMATION_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="still_available" defaultChecked={provenance?.still_available ?? true} />
              Still available (this recorded observation refreshes &ldquo;last observed&rdquo; above)
            </label>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Source URL</label>
              <input className="input" name="source_url" defaultValue={provenance?.source_url ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Source reference</label>
              <input className="input" name="source_reference" defaultValue={provenance?.source_reference ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
              <textarea className="input" name="notes" rows={2} defaultValue={provenance?.notes ?? ""} />
            </div>
            <button type="submit" className="btn-secondary">
              Save
            </button>
          </form>
        </details>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Diligence items ({diligenceItems.length})
        </h2>
        {diligenceItems.length === 0 ? (
          <p className="text-sm text-muted">None tracked yet.</p>
        ) : (
          <div className="space-y-2">
            {diligenceItems.map((item) => (
              <div key={item.id} className="card flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.item_type.replace(/_/g, " ")}</p>
                  {item.notes && <p className="text-xs text-muted">{item.notes}</p>}
                  {item.received_at && (
                    <p className="text-xs text-muted">Received {new Date(item.received_at).toLocaleDateString()}</p>
                  )}
                </div>
                <DiligenceItemStatusSelect
                  value={item.status}
                  action={setDiligenceItemStatus.bind(null, item.id, opportunityId)}
                />
              </div>
            ))}
          </div>
        )}

        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">Add a diligence item</summary>
          <form action={addDiligenceItem.bind(null, opportunityId)} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Type</label>
              <select className="input" name="item_type" defaultValue="other">
                {DILIGENCE_ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
              <textarea className="input" name="notes" rows={2} />
            </div>
            <button type="submit" className="btn-secondary">
              Add
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
