import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAssets } from "@/lib/queries";

export default async function AssetsPage() {
  await requireCapitalEcosystemEnabled();
  const assets = await getAssets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-muted">
            Real estate, equipment, IP — owned, leased, or licensed. Ownership type matters: a
            leased building a business operates out of isn't the same as something Atlas owns.
          </p>
        </div>
        <Link href="/assets/new" className="btn">
          New asset
        </Link>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-muted">No assets yet.</p>
      ) : (
        <div className="space-y-2">
          {assets.map((a) => (
            <Link key={a.id} href={`/assets/${a.id}`} className="card block hover:border-accent">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.name}</span>
                <div className="flex gap-1">
                  <span className="badge">{a.asset_type.replace("_", " ")}</span>
                  <span className="badge">{a.ownership_type}</span>
                  <StatusBadge status={a.status} />
                </div>
              </div>
              {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
