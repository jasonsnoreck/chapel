import Link from "next/link";
import { getFeatureFlag } from "@/lib/featureFlags";
import { toggleFeatureFlag } from "@/lib/actions/investors";
import { getInvestorProfiles } from "@/lib/queries";

export default async function InvestorsPage() {
  const flag = await getFeatureFlag("investor_protocol_enabled");
  const enabled = flag?.enabled ?? false;

  if (!enabled) {
    return (
      <div className="max-w-xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Investor Protocol</h1>
          <p className="mt-1 text-sm text-muted">Internal / future module — not enabled.</p>
        </div>
        <div className="card space-y-3 text-sm">
          <p>
            Atlas is currently founder-funded and single-user. No outside investors are being
            onboarded. This module is architectural foundation only: it lets the founder record
            investor relationships and model possible investment configurations internally — it
            is not an onboarding flow, solicitation, portal, or document-execution system, and
            nothing here is legally binding until reviewed by qualified counsel.
          </p>
          <p className="text-muted">Enabling it only reveals internal record-keeping to you, the founder.</p>
          <form action={toggleFeatureFlag.bind(null, "investor_protocol_enabled", true)}>
            <button type="submit" className="btn">
              Enable internal module
            </button>
          </form>
        </div>
      </div>
    );
  }

  const investors = await getInvestorProfiles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Investors</h1>
          <p className="text-sm text-muted">
            Internal record-keeping only — not an onboarding or solicitation system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/investors/structures" className="btn-secondary">
            Approved structures
          </Link>
          <Link href="/investors/new" className="btn">
            New investor profile
          </Link>
        </div>
      </div>

      <form action={toggleFeatureFlag.bind(null, "investor_protocol_enabled", false)}>
        <button type="submit" className="text-xs text-muted hover:text-ink">
          Disable this module
        </button>
      </form>

      {investors.length === 0 ? (
        <p className="text-sm text-muted">No investor profiles yet.</p>
      ) : (
        <div className="space-y-2">
          {investors.map((i) => (
            <Link key={i.id} href={`/investors/${i.id}`} className="card block hover:border-accent">
              <div className="flex items-center justify-between">
                <span className="font-medium">{i.name}</span>
                <span className="badge">{i.relationship_status}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                <span>{i.entity_type}</span>
                {i.preferred_involvement_level && <span>{i.preferred_involvement_level.replace("_", " ")}</span>}
                <span>{i.qualification_status.replace("_", " ")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
