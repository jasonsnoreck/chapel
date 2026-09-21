import Link from "next/link";
import { searchAll } from "@/lib/queries";

const TYPE_LABELS: Record<string, string> = {
  opportunity: "Opportunity",
  project: "Project",
  business: "Business",
  decision: "Decision",
  principle: "Principle",
  note: "Note",
};

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const results = q ? await searchAll(q) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Search</h1>
        <form action="/search" className="mt-3">
          <input className="input max-w-md" type="search" name="q" defaultValue={q} placeholder="Search Atlas…" autoFocus />
        </form>
      </div>

      {q && (
        <p className="text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <Link key={`${r.type}:${r.id}`} href={r.href} className="card block hover:border-accent">
            <div className="flex items-center gap-2">
              <span className="badge">{TYPE_LABELS[r.type]}</span>
              <span className="font-medium">{r.title}</span>
            </div>
            {r.snippet && <p className="mt-1 line-clamp-2 text-sm text-muted">{r.snippet}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
