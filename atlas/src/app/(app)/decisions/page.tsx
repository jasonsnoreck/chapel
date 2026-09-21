import Link from "next/link";
import { getDecisions } from "@/lib/queries";

export default async function DecisionsPage() {
  const decisions = await getDecisions();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Decisions</h1>
          <p className="text-sm text-muted">Institutional memory — what was decided, and why.</p>
        </div>
        <Link href="/decisions/new" className="btn-secondary">
          Record a decision
        </Link>
      </div>

      {decisions.length === 0 ? (
        <p className="text-sm text-muted">No decisions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {decisions.map((d) => {
            const due = d.review_date && d.review_date <= today;
            return (
              <div key={d.id} className="card">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{d.subject}</span>
                  <span className="text-xs text-muted">{d.decided_at}</span>
                </div>
                <p className="mt-1 text-sm">{d.decision}</p>
                {d.reasoning && <p className="mt-1 text-sm text-muted">{d.reasoning}</p>}
                {d.review_date && (
                  <p className={`mt-1 text-xs ${due ? "font-medium text-amber-700" : "text-muted"}`}>
                    {due ? "Review due" : "Review by"} {d.review_date}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
