import type { AiAnalysis } from "@/lib/types";
import { analyzeOpportunity } from "@/lib/actions/ai";
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

export default function AnalysisPanel({ opportunityId, analyses }: { opportunityId: string; analyses: AiAnalysis[] }) {
  const latest = analyses[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">AI analysis</h2>
        <form action={analyzeOpportunity.bind(null, opportunityId)}>
          <SubmitButton pendingLabel="Analyzing…">Analyze with Atlas</SubmitButton>
        </form>
      </div>

      {!latest ? (
        <p className="text-sm text-muted">No analysis yet. Atlas will suggest, never decide.</p>
      ) : (
        <div className="card space-y-4">
          <p className="rounded-md bg-paper px-3 py-2 text-xs text-muted">
            {latest.result.disclaimer} — {latest.provider}
            {latest.model ? ` (${latest.model})` : ""}, {new Date(latest.created_at).toLocaleString()}
          </p>

          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">What is it?</h3>
            <p className="text-sm">{latest.result.what_is_it}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Why might it matter?</h3>
            <p className="text-sm">{latest.result.why_it_might_matter}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">What would need to be true (assumptions)</h3>
            <List items={latest.result.what_would_need_to_be_true} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">What we don&rsquo;t know</h3>
            <List items={latest.result.what_we_dont_know} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Cheapest useful test</h3>
            <p className="text-sm">{latest.result.cheapest_useful_test}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Potential Atlas fit</h3>
            <p className="text-sm">{latest.result.potential_atlas_fit}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Risks</h3>
            <List items={latest.result.risks} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Suggested next step (a suggestion, not a decision)</h3>
            <p className="text-sm font-medium">{latest.result.suggested_next_step}</p>
          </div>
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
                <p className="text-sm">{a.result.what_is_it}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
