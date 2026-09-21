import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { getAllPredictions } from "@/lib/queries-capital";
import PredictionEvaluationForm from "@/components/PredictionEvaluationForm";
import type { Prediction, PredictionCategory, PredictionStatus, VarianceReason } from "@/lib/types";

const STATUS_ORDER: PredictionStatus[] = [
  "proposed",
  "under_evaluation",
  "developing",
  "validated",
  "contradicted",
  "expired",
  "unable_to_evaluate",
];

const STATUS_LABEL: Record<PredictionStatus, string> = {
  proposed: "Proposed",
  under_evaluation: "Under evaluation",
  developing: "Developing",
  validated: "Validated",
  contradicted: "Contradicted",
  expired: "Expired (horizon passed)",
  unable_to_evaluate: "Unable to evaluate",
};

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

// Accuracy is computed only over predictions that reached a real
// resolution (validated/contradicted) — expired and unable_to_evaluate
// are explicitly excluded, since "hasn't happened yet" is not failure
// and must never be folded into an accuracy denominator.
function accuracyByCategory(predictions: Prediction[]) {
  const resolved = predictions.filter((p) => p.status === "validated" || p.status === "contradicted");
  const byCategory = groupBy(resolved, (p) => p.category as PredictionCategory);
  return Object.entries(byCategory).map(([category, items]) => {
    const validated = items.filter((p) => p.status === "validated").length;
    return { category, validated, total: items.length, rate: items.length ? validated / items.length : 0 };
  });
}

function varianceReasonCounts(predictions: Prediction[]) {
  const withReason = predictions.filter((p) => p.variance_reason);
  const counts = groupBy(withReason, (p) => p.variance_reason as VarianceReason);
  return Object.entries(counts)
    .map(([reason, items]) => ({ reason, count: items.length }))
    .sort((a, b) => b.count - a.count);
}

export default async function IntelligencePage() {
  await requireCapitalEcosystemEnabled();

  const predictions = await getAllPredictions();
  const byStatus = groupBy(predictions, (p) => p.status);
  const accuracy = accuracyByCategory(predictions);
  const varianceReasons = varianceReasonCounts(predictions);
  const resolvedCount = predictions.filter((p) => p.status === "validated" || p.status === "contradicted").length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Intelligence</h1>
        <p className="text-sm text-muted">
          What Atlas AI has predicted, and what actually happened. This is not an AI score — it's a
          record of hypotheses by status and category, so you can see what Atlas is actually good at
          understanding versus where it tends to guess wrong. A prediction that hasn&apos;t resolved
          yet is not a failure.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">By status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="card">
              <div className="text-2xl font-semibold">{(byStatus[status] ?? []).length}</div>
              <div className="text-xs text-muted">{STATUS_LABEL[status]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Accuracy by category ({resolvedCount} resolved)
        </h2>
        {accuracy.length === 0 ? (
          <p className="text-sm text-muted">
            No predictions have reached validated/contradicted yet. Accuracy only counts predictions
            that actually resolved — expired and unable-to-evaluate predictions are excluded on purpose.
          </p>
        ) : (
          <div className="space-y-2">
            {accuracy.map((a) => (
              <div key={a.category} className="card flex items-center justify-between">
                <span className="text-sm">{a.category.replace(/_/g, " ")}</span>
                <span className="text-sm text-muted">
                  {a.validated}/{a.total} validated ({Math.round(a.rate * 100)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {varianceReasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Common causes of variance
          </h2>
          <p className="text-xs text-muted">
            A single inaccurate prediction doesn&apos;t prove the underlying relationship or model was
            wrong — these reasons distinguish execution/market causes from Atlas&apos;s own reasoning
            or data quality.
          </p>
          <div className="flex flex-wrap gap-2">
            {varianceReasons.map((v) => (
              <span key={v.reason} className="badge">
                {v.reason.replace(/_/g, " ")}: {v.count}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          All predictions ({predictions.length})
        </h2>
        {predictions.length === 0 ? (
          <p className="text-sm text-muted">
            None yet. Predictions are created automatically when Atlas discovers ecosystem
            relationships with a stated potential effect, and will accumulate from other AI analyses
            over time.
          </p>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => (
              <div key={p.id} className="card space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{STATUS_LABEL[p.status]}</span>
                  <span className="badge">{p.category.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted">
                    {p.subject_type.replace(/_/g, " ")} · {new Date(p.predicted_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{p.prediction_summary}</p>
                {p.expected_outcome && (
                  <p className="text-xs text-muted">Expected: {p.expected_outcome}</p>
                )}
                {p.observed_outcome && (
                  <p className="text-xs text-muted">Observed: {p.observed_outcome}</p>
                )}
                {p.variance && <p className="text-xs text-muted">Variance: {p.variance}</p>}
                {p.variance_reason && (
                  <p className="text-xs text-muted">Reason: {p.variance_reason.replace(/_/g, " ")}</p>
                )}
                <PredictionEvaluationForm prediction={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
