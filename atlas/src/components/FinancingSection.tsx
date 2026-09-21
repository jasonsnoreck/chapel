import type { FinancingEvent, FinancingPosition } from "@/lib/types";
import { createFinancingPosition, recordFinancingEvent, setFinancingPositionStatus } from "@/lib/actions/financing";
import { derivedBalance } from "@/lib/queries-capital";
import FinancingPositionStatusSelect from "@/components/FinancingPositionStatusSelect";

export default function FinancingSection({
  targetType,
  targetId,
  positions,
  eventsByPosition,
}: {
  targetType: "asset" | "business";
  targetId: string;
  positions: FinancingPosition[];
  eventsByPosition: Record<string, FinancingEvent[]>;
}) {
  const totalBalance = positions
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + derivedBalance(eventsByPosition[p.id] ?? []), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Financing</h2>
        <span className="text-sm text-muted">Current encumbrance: ${totalBalance.toLocaleString()}</span>
      </div>
      <p className="text-xs text-muted">
        Balances below are derived from the event ledger each time, never stored as a running
        total — a missed entry leaves an incomplete ledger, not a silently wrong balance.
      </p>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Open a new financing position</summary>
        <form action={createFinancingPosition.bind(null, targetType, targetId)} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Type</label>
              <select className="input" name="position_type" defaultValue="mortgage">
                <option value="mortgage">Mortgage</option>
                <option value="loan">Loan</option>
                <option value="line_of_credit">Line of credit</option>
                <option value="seller_note">Seller note</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Lender</label>
              <input className="input" name="lender" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Opened</label>
            <input className="input" name="opened_at" type="date" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
            <textarea className="input" name="notes" rows={2} />
          </div>
          <button type="submit" className="btn">
            Create position
          </button>
        </form>
      </details>

      {positions.length === 0 ? (
        <p className="text-sm text-muted">No financing positions recorded.</p>
      ) : (
        <div className="space-y-2">
          {positions.map((p) => {
            const events = eventsByPosition[p.id] ?? [];
            const balance = derivedBalance(events);
            return (
              <div key={p.id} className="card space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">{p.position_type.replace("_", " ")}</span>
                    {p.lender && <span className="ml-2 text-sm text-muted">{p.lender}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${balance.toLocaleString()}</span>
                    <FinancingPositionStatusSelect
                      value={p.status}
                      action={setFinancingPositionStatus.bind(null, p.id, targetType, targetId)}
                    />
                  </div>
                </div>
                {p.notes && <p className="text-sm text-muted">{p.notes}</p>}

                <details>
                  <summary className="cursor-pointer text-xs link-quiet">Record an event ({events.length} so far)</summary>
                  <form action={recordFinancingEvent.bind(null, p.id, targetType, targetId)} className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input" name="event_type" defaultValue="draw">
                        <option value="draw">Draw</option>
                        <option value="principal_payment">Principal payment</option>
                        <option value="refinance">Refinance (closes this position)</option>
                        <option value="payoff">Payoff</option>
                        <option value="modification">Modification (no balance change)</option>
                        <option value="other">Other</option>
                      </select>
                      <input className="input" name="amount" type="number" step="0.01" placeholder="Amount ($)" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" name="event_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                      <select className="input" name="destination_type" defaultValue="">
                        <option value="">Destination (optional)</option>
                        <option value="opportunity">Opportunity</option>
                        <option value="project">Project</option>
                        <option value="business">Business</option>
                        <option value="asset">Asset</option>
                        <option value="capital_need">Capital need</option>
                        <option value="general">General / operating</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input className="input" name="notes" placeholder="Notes" />
                    <button type="submit" className="btn-secondary">
                      Record event
                    </button>
                  </form>
                </details>

                {events.length > 0 && (
                  <div className="space-y-1">
                    {events.map((e) => (
                      <div key={e.id} className="rounded-md bg-paper px-2 py-1.5 text-xs">
                        {e.event_date} — {e.event_type.replace("_", " ")} ({e.direction}) — ${e.amount.toLocaleString()}
                        {e.notes ? ` — ${e.notes}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
