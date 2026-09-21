import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAsset, getAssets, getBusinesses } from "@/lib/queries";
import {
  getCapitalNeedsFor,
  getCapitalUtilityAssessmentsFor,
  getEcosystemRelationshipsFor,
  getExternalEntities,
  getFinancingEventsFor,
  getFinancingPositionsFor,
  getValuationsFor,
} from "@/lib/queries-capital";
import { updateAsset } from "@/lib/actions/assets";
import StatusBadge from "@/components/StatusBadge";
import ValuationSection from "@/components/ValuationSection";
import FinancingSection from "@/components/FinancingSection";
import CapitalUtilitySection from "@/components/CapitalUtilitySection";
import EcosystemRelationshipsSection from "@/components/EcosystemRelationshipsSection";
import type { FinancingEvent } from "@/lib/types";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  await requireCapitalEcosystemEnabled();

  const asset = await getAsset(params.id);
  if (!asset) notFound();

  const [valuations, positions, capitalUtility, relationships, capitalNeeds, allBusinesses, allAssets, externalEntities] =
    await Promise.all([
      getValuationsFor("asset", asset.id),
      getFinancingPositionsFor("asset", asset.id),
      getCapitalUtilityAssessmentsFor("asset", asset.id),
      getEcosystemRelationshipsFor("asset", asset.id),
      getCapitalNeedsFor("asset", asset.id),
      getBusinesses(),
      getAssets(),
      getExternalEntities(),
    ]);

  const eventsByPosition: Record<string, FinancingEvent[]> = {};
  await Promise.all(
    positions.map(async (p) => {
      eventsByPosition[p.id] = await getFinancingEventsFor(p.id);
    })
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={asset.status} />
            <span className="badge">{asset.asset_type.replace("_", " ")}</span>
            <span className="badge">{asset.ownership_type}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{asset.name}</h1>
          {asset.description && <p className="mt-1 text-muted">{asset.description}</p>}
          {asset.ownership_type !== "owned" && (
            <p className="mt-2 text-xs text-amber-700">
              This asset is marked "{asset.ownership_type}" — Atlas doesn't own it outright, so
              valuation/financing here describes Atlas's actual interest, not the underlying
              property.
            </p>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm link-quiet">Edit</summary>
            <form action={updateAsset.bind(null, asset.id)} className="card mt-2 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input className="input" name="name" defaultValue={asset.name} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                <textarea className="input" name="description" rows={3} defaultValue={asset.description ?? ""} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Status</label>
                  <select className="input" name="status" defaultValue={asset.status}>
                    <option value="active">Active</option>
                    <option value="dormant">Dormant</option>
                    <option value="sold">Sold</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Asset type</label>
                  <select className="input" name="asset_type" defaultValue={asset.asset_type}>
                    <option value="real_estate">Real estate</option>
                    <option value="equipment">Equipment</option>
                    <option value="intellectual_property">Intellectual property</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Ownership</label>
                  <select className="input" name="ownership_type" defaultValue={asset.ownership_type}>
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="licensed">Licensed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn">
                Save
              </button>
            </form>
          </details>
        </div>

        <ValuationSection targetType="asset" targetId={asset.id} valuations={valuations} />
        <FinancingSection targetType="asset" targetId={asset.id} positions={positions} eventsByPosition={eventsByPosition} />
        <CapitalUtilitySection targetType="asset" targetId={asset.id} assessments={capitalUtility} />
      </div>

      <div className="space-y-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Capital needs</h2>
            <Link href="/capital" className="text-xs link-quiet">
              Manage in Capital
            </Link>
          </div>
          {capitalNeeds.length === 0 ? (
            <p className="mt-2 text-sm text-muted">None recorded.</p>
          ) : (
            <div className="mt-2 space-y-1">
              {capitalNeeds.map((n) => (
                <div key={n.id} className="text-sm">
                  {n.purpose || "Capital need"} — {n.amount ? `$${n.amount.toLocaleString()}` : "amount TBD"}{" "}
                  <span className="badge">{n.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <EcosystemRelationshipsSection
          nodeType="asset"
          nodeId={asset.id}
          relationships={relationships}
          businesses={allBusinesses}
          assets={allAssets.filter((a) => a.id !== asset.id)}
          externalEntities={externalEntities}
          revalidatePathTarget={`/assets/${asset.id}`}
        />
      </div>
    </div>
  );
}
