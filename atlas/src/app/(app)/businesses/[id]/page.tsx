import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAssets, getBusiness, getBusinesses } from "@/lib/queries";
import {
  getCapitalNeedsFor,
  getCapitalUtilityAssessmentsFor,
  getEcosystemRelationshipsFor,
  getExternalEntities,
  getFinancingEventsFor,
  getFinancingPositionsFor,
  getValuationsFor,
} from "@/lib/queries-capital";
import { updateBusiness } from "@/lib/actions/businesses";
import StatusBadge from "@/components/StatusBadge";
import ValuationSection from "@/components/ValuationSection";
import FinancingSection from "@/components/FinancingSection";
import CapitalUtilitySection from "@/components/CapitalUtilitySection";
import EcosystemRelationshipsSection from "@/components/EcosystemRelationshipsSection";
import type { FinancingEvent } from "@/lib/types";

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  await requireCapitalEcosystemEnabled();

  const business = await getBusiness(params.id);
  if (!business) notFound();

  const [valuations, positions, capitalUtility, relationships, capitalNeeds, allBusinesses, allAssets, externalEntities] =
    await Promise.all([
      getValuationsFor("business", business.id),
      getFinancingPositionsFor("business", business.id),
      getCapitalUtilityAssessmentsFor("business", business.id),
      getEcosystemRelationshipsFor("business", business.id),
      getCapitalNeedsFor("business", business.id),
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
            <StatusBadge status={business.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          {business.description && <p className="mt-1 text-muted">{business.description}</p>}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm link-quiet">Edit</summary>
            <form action={updateBusiness.bind(null, business.id)} className="card mt-2 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input className="input" name="name" defaultValue={business.name} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                <textarea className="input" name="description" rows={3} defaultValue={business.description ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Status</label>
                <select className="input" name="status" defaultValue={business.status}>
                  <option value="active">Active</option>
                  <option value="dormant">Dormant</option>
                  <option value="sold">Sold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button type="submit" className="btn">
                Save
              </button>
            </form>
          </details>
        </div>

        <ValuationSection targetType="business" targetId={business.id} valuations={valuations} />
        <FinancingSection targetType="business" targetId={business.id} positions={positions} eventsByPosition={eventsByPosition} />
        <CapitalUtilitySection targetType="business" targetId={business.id} assessments={capitalUtility} />
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
          nodeType="business"
          nodeId={business.id}
          relationships={relationships}
          businesses={allBusinesses.filter((b) => b.id !== business.id)}
          assets={allAssets}
          externalEntities={externalEntities}
          revalidatePathTarget={`/businesses/${business.id}`}
        />
      </div>
    </div>
  );
}
