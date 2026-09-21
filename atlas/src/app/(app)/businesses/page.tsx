import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getBusinesses } from "@/lib/queries";

export default async function BusinessesPage() {
  await requireCapitalEcosystemEnabled();
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Businesses</h1>
          <p className="text-sm text-muted">Real operating businesses — object plus financial profile.</p>
        </div>
        <Link href="/businesses/new" className="btn">
          New business
        </Link>
      </div>

      {businesses.length === 0 ? (
        <p className="text-sm text-muted">No businesses yet.</p>
      ) : (
        <div className="space-y-2">
          {businesses.map((b) => (
            <Link key={b.id} href={`/businesses/${b.id}`} className="card block hover:border-accent">
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <StatusBadge status={b.status} />
              </div>
              {b.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
