import Link from "next/link";
import type { Decision } from "@/lib/types";

export default function DecisionsList({
  decisions,
  newHref,
}: {
  decisions: Decision[];
  newHref: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Decisions</h2>
        <Link href={newHref} className="text-sm link-quiet">
          Record a decision
        </Link>
      </div>
      {decisions.length === 0 ? (
        <p className="text-sm text-muted">No decisions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {decisions.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.decision}</span>
                <span className="text-xs text-muted">{d.decided_at}</span>
              </div>
              {d.reasoning && <p className="mt-1 text-sm text-muted">{d.reasoning}</p>}
              {d.review_date && <p className="mt-1 text-xs text-muted">Review by {d.review_date}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
