import Link from "next/link";
import { getFeatureFlag } from "@/lib/featureFlags";
import { toggleFeatureFlag } from "@/lib/actions/investors";

export default async function CapitalEcosystemLandingPage() {
  const flag = await getFeatureFlag("capital_ecosystem_enabled");
  const enabled = flag?.enabled ?? false;

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Capital &amp; Ecosystem</h1>
        <p className="mt-1 text-sm text-muted">
          Internal / future module — {enabled ? "enabled" : "not enabled"}.
        </p>
      </div>
      <div className="card space-y-3 text-sm">
        <p>
          This models Atlas as an evolving economic network: businesses and assets with their own
          unlevered value and financing history, what capital an opportunity needs and what could
          supply it, and the relationships — supplier, customer, shared capacity, conflicts, and
          more — between things Atlas already owns. None of it is a financing guarantee, a
          valuation promise, or an investment decision; it's internal record-keeping and
          AI-assisted discovery for the founder to review.
        </p>
        <p className="text-muted">Enabling it only reveals internal record-keeping to you, the founder.</p>
        {enabled ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/businesses" className="btn">Businesses</Link>
            <Link href="/assets" className="btn-secondary">Assets</Link>
            <Link href="/capital" className="btn-secondary">Capital</Link>
            <Link href="/ecosystem" className="btn-secondary">Ecosystem</Link>
            <Link href="/intelligence" className="btn-secondary">Intelligence</Link>
          </div>
        ) : (
          <form action={toggleFeatureFlag.bind(null, "capital_ecosystem_enabled", true)}>
            <button type="submit" className="btn">
              Enable internal module
            </button>
          </form>
        )}
        {enabled && (
          <form action={toggleFeatureFlag.bind(null, "capital_ecosystem_enabled", false)}>
            <button type="submit" className="text-xs text-muted hover:text-ink">
              Disable this module
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
