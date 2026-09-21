import Link from "next/link";
import { getOpportunities } from "@/lib/queries";
import { setOpportunityAttention, setOpportunityStatus } from "@/lib/actions/opportunities";

export default async function InboxPage() {
  const opportunities = await getOpportunities({ status: "captured" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted">
          Capture is cheap. Commitment is expensive. Review each idea and decide where it goes.
        </p>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-muted">Nothing waiting for review.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/opportunities/${o.id}`} className="font-medium hover:underline">
                    {o.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {o.short_description || o.full_description || "No description yet."}
                  </p>
                  <p className="mt-1 text-xs text-muted">Captured {new Date(o.captured_at).toLocaleDateString()}</p>
                </div>
                <Link href={`/opportunities/${o.id}`} className="btn-secondary shrink-0">
                  Read &amp; analyze
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <form action={setOpportunityStatus.bind(null, o.id, "evaluating")}>
                  <button className="badge hover:border-accent hover:text-accent" type="submit">
                    Move to evaluating
                  </button>
                </form>
                <form action={setOpportunityAttention.bind(null, o.id, "later")}>
                  <button className="badge hover:border-accent hover:text-accent" type="submit">
                    Defer (later)
                  </button>
                </form>
                <form action={setOpportunityAttention.bind(null, o.id, "watch")}>
                  <button className="badge hover:border-accent hover:text-accent" type="submit">
                    Watch
                  </button>
                </form>
                <form action={setOpportunityStatus.bind(null, o.id, "archived")}>
                  <button className="badge hover:border-accent hover:text-accent" type="submit">
                    Archive
                  </button>
                </form>
                <form action={setOpportunityStatus.bind(null, o.id, "killed")}>
                  <button className="badge hover:border-red-400 hover:text-red-700" type="submit">
                    Kill
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
