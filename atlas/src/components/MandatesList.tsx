import type { InvestmentMandate } from "@/lib/types";
import { updateMandateStatus } from "@/lib/actions/investors";
import MandateStatusSelect from "@/components/MandateStatusSelect";

function flagsOn(obj: Record<string, boolean | undefined> | undefined): string[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, " "));
}

export default function MandatesList({ mandates, investorProfileId }: { mandates: InvestmentMandate[]; investorProfileId: string }) {
  if (mandates.length === 0) {
    return <p className="text-sm text-muted">No investment mandates yet.</p>;
  }

  return (
    <div className="space-y-3">
      {mandates.map((m) => {
        const economics = flagsOn(m.rights.economics);
        const control = flagsOn(m.rights.control);
        const liquidity = flagsOn(m.rights.liquidity);
        const atlasAccess = flagsOn(m.rights.atlas_access);

        return (
          <div key={m.id} className="card space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">
                  {m.target_type === "atlas"
                    ? "Atlas itself"
                    : m.target_type === "other"
                      ? m.target_note || "Other / future vehicle"
                      : `${m.target_type}${m.target_note ? ` — ${m.target_note}` : ""}`}
                </span>
                {m.investment_amount != null && (
                  <span className="ml-2 text-sm text-muted">${m.investment_amount.toLocaleString()}</span>
                )}
              </div>
              <MandateStatusSelect value={m.status} action={updateMandateStatus.bind(null, m.id, investorProfileId)} />
            </div>

            {m.investment_type && <p className="text-sm text-muted">{m.investment_type}</p>}
            {m.contribution_types.length > 0 && (
              <p className="text-xs text-muted">Contributions: {m.contribution_types.join(", ").replace(/_/g, " ")}</p>
            )}

            <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
              {m.rights.involvement && <span>Involvement: {m.rights.involvement.replace("_", " ")}</span>}
              {m.rights.information && <span>Information: {m.rights.information.replace("_", " ")}</span>}
              {economics.length > 0 && <span>Economics: {economics.join(", ")}</span>}
              {control.length > 0 && <span>Control: {control.join(", ")}</span>}
              {liquidity.length > 0 && <span>Liquidity: {liquidity.join(", ")}</span>}
              {atlasAccess.length > 0 && <span>Atlas access: {atlasAccess.join(", ")}</span>}
            </div>

            {m.special_conditions && (
              <p className="text-sm">
                <span className="font-medium">Special conditions:</span> {m.special_conditions}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
