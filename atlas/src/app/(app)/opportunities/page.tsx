import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getOpportunities, type OpportunityFilters } from "@/lib/queries";

const STATUSES = ["captured", "evaluating", "approved", "active_project", "graduated", "killed", "archived"];
const ATTENTIONS = ["now", "later", "watch", "archived"];

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { status?: string; attention?: string; category?: string; q?: string };
}) {
  const opportunities = await getOpportunities(searchParams as OpportunityFilters);

  const filterHref = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (params.get(key) === value) params.delete(key);
    else params.set(key, value);
    return `/opportunities?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Opportunities</h1>
        <Link href="/opportunities/new" className="btn-secondary">
          New opportunity
        </Link>
      </div>

      <form className="flex gap-2" action="/opportunities">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Filter by keyword…"
          className="input max-w-sm"
        />
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted">Status:</span>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={filterHref("status", s)}
            className={`badge ${searchParams.status === s ? "border-accent text-accent" : ""}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted">Attention:</span>
        {ATTENTIONS.map((a) => (
          <Link
            key={a}
            href={filterHref("attention", a)}
            className={`badge ${searchParams.attention === a ? "border-accent text-accent" : ""}`}
          >
            {a}
          </Link>
        ))}
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-muted">No opportunities match these filters.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}
    </div>
  );
}
