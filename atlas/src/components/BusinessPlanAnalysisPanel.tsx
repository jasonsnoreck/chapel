import type { BusinessPlanAnalysis } from "@/lib/types";
import { analyzeBusinessPlan } from "@/lib/actions/business-plan";
import SubmitButton from "@/components/SubmitButton";

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted">None noted.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase text-muted">{label}</h3>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function BusinessPlanAnalysisPanel({
  opportunityId,
  hasPlanText,
  analyses,
}: {
  opportunityId: string;
  hasPlanText: boolean;
  analyses: BusinessPlanAnalysis[];
}) {
  const latest = analyses[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Business plan analysis</h2>
        {hasPlanText ? (
          <form action={analyzeBusinessPlan.bind(null, opportunityId)}>
            <SubmitButton pendingLabel="Analyzing plan…">Analyze as business plan</SubmitButton>
          </form>
        ) : (
          <span className="text-xs text-muted">Add a description to analyze</span>
        )}
      </div>

      {!latest ? (
        <p className="text-sm text-muted">
          No business plan analysis yet. This reads the description above as a plan and pulls out
          facts, assumptions, unknowns, and how it fits (or conflicts with) the rest of Atlas — not
          a verdict on whether it&rsquo;s a good business.
        </p>
      ) : (
        <div className="card space-y-4">
          <p className="rounded-md bg-paper px-3 py-2 text-xs text-muted">
            {latest.result.disclaimer} — {latest.provider}
            {latest.model ? ` (${latest.model})` : ""}, {new Date(latest.created_at).toLocaleString()}
          </p>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Facts (stated in the plan)</h3>
            <List items={latest.result.facts} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Assumptions</h3>
            <List items={latest.result.assumptions} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Unknowns</h3>
            <List items={latest.result.unknowns} />
          </div>

          <Field label="Business model" value={latest.result.business_model} />
          <Field label="Revenue model" value={latest.result.revenue_model} />
          <Field label="Cost structure" value={latest.result.cost_structure} />
          <Field label="Startup capital estimate" value={latest.result.startup_capital_estimate} />
          <Field label="Working capital estimate" value={latest.result.working_capital_estimate} />
          <Field label="Break-even assumptions" value={latest.result.break_even_assumptions} />
          <Field label="Operational requirements" value={latest.result.operational_requirements} />
          <Field label="Capital requirements" value={latest.result.capital_requirements} />

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Risks</h3>
            <List items={latest.result.risks} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Missing information</h3>
            <List items={latest.result.missing_information} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Diligence questions</h3>
            <List items={latest.result.diligence_questions} />
          </div>

          <Field label="Fit with existing Atlas businesses/assets" value={latest.result.atlas_relationships} />
          <Field label="Ecosystem opportunities" value={latest.result.ecosystem_opportunities} />
          <Field label="Ecosystem conflicts" value={latest.result.ecosystem_conflicts} />
          <Field label="Benchmark comparisons" value={latest.result.benchmark_comparisons} />
        </div>
      )}

      {analyses.length > 1 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted">
            {analyses.length - 1} earlier {analyses.length - 1 === 1 ? "analysis" : "analyses"}
          </summary>
          <div className="mt-2 space-y-2">
            {analyses.slice(1).map((a) => (
              <div key={a.id} className="card">
                <p className="mb-1 text-xs text-muted">
                  {a.provider}
                  {a.model ? ` (${a.model})` : ""} — {new Date(a.created_at).toLocaleString()}
                </p>
                <p className="text-sm">{a.result.business_model}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
