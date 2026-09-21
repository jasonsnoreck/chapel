import type { CapitalUtilityAssessment, CapitalUtilityTargetType } from "@/lib/types";
import { recordCapitalUtilityAssessment } from "@/lib/actions/capital";

const DIMENSIONS: [key: keyof CapitalUtilityAssessment["assessment"], label: string][] = [
  ["borrowing_capacity", "Borrowing capacity"],
  ["collateral_quality", "Collateral quality"],
  ["lending_accessibility", "Lending accessibility"],
  ["liquidity", "Liquidity"],
  ["cash_flow_capacity", "Cash-flow capacity"],
  ["equity_generation_potential", "Equity-generation potential"],
  ["ability_to_support_other_atlas_business", "Ability to support another Atlas business"],
  ["encumbrance_tolerance", "Encumbrance tolerance"],
  ["strategic_importance", "Strategic importance"],
  ["saleability", "Saleability"],
];

export default function CapitalUtilitySection({
  targetType,
  targetId,
  assessments,
}: {
  targetType: CapitalUtilityTargetType;
  targetId: string;
  assessments: CapitalUtilityAssessment[];
}) {
  const latest = assessments[0];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Capital utility</h2>
      <p className="text-xs text-muted">
        What financing capacity ownership creates — not the same as value, and never a financing
        guarantee. A paid-off building can have high collateral quality and low liquidity; a
        rented-space business can be the reverse.
      </p>

      {latest ? (
        <div className="card grid grid-cols-2 gap-2 text-sm">
          {DIMENSIONS.map(([key, label]) =>
            latest.assessment[key] ? (
              <div key={key}>
                <span className="text-muted">{label}:</span> {latest.assessment[key]}
              </div>
            ) : null
          )}
          {latest.notes && <p className="col-span-2 mt-1 text-muted">{latest.notes}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted">No assessment recorded yet.</p>
      )}

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Record an assessment</summary>
        <form action={recordCapitalUtilityAssessment.bind(null, targetType, targetId)} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {DIMENSIONS.map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
                <select className="input" name={key} defaultValue="">
                  <option value="">Unassessed</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
            <textarea className="input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn">
            Save assessment
          </button>
        </form>
      </details>
    </div>
  );
}
