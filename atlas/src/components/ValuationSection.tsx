import type { AssetValuation } from "@/lib/types";
import { recordValuation } from "@/lib/actions/financing";

// The unlevered economic position — deliberately untouched by financing
// (see FinancingSection). Append-only: "current value" is just the most
// recent row here, never overwritten.
export default function ValuationSection({
  targetType,
  targetId,
  valuations,
}: {
  targetType: "asset" | "business";
  targetId: string;
  valuations: AssetValuation[];
}) {
  const latest = valuations[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Unlevered value</h2>
        {latest && (
          <span className="text-lg font-semibold">
            ${latest.value.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted">as of {latest.as_of_date}</span>
          </span>
        )}
      </div>
      <p className="text-xs text-muted">
        This is an internal estimate for Atlas's own decision-making, not a formal appraisal —
        and it never changes because of financing (see below). Debt against this asset doesn't
        make it worth less; it's tracked separately.
      </p>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Record a valuation</summary>
        <form action={recordValuation.bind(null, targetType, targetId)} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Value ($)</label>
            <input className="input" name="value" type="number" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">As of</label>
              <input className="input" name="as_of_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Basis</label>
              <input className="input" name="basis" placeholder="e.g. founder estimate, appraisal" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
            <textarea className="input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn">
            Save
          </button>
        </form>
      </details>

      {valuations.length > 1 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted">{valuations.length - 1} earlier valuation(s)</summary>
          <div className="mt-2 space-y-1">
            {valuations.slice(1).map((v) => (
              <div key={v.id} className="rounded-md bg-paper px-2 py-1.5 text-xs">
                ${v.value.toLocaleString()} as of {v.as_of_date}
                {v.basis ? ` — ${v.basis}` : ""}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
