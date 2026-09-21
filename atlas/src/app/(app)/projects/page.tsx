import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getProjects } from "@/lib/queries";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted">Opportunities the founder has committed to actively developing.</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">
          No projects yet. Promote an opportunity from its detail page to start one.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block hover:border-accent">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium">{p.name}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.objective || "No objective set."}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.next_action ? `Next: ${p.next_action}` : "No next action set"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-muted">
                    ${p.capital_invested} · {p.time_invested_hours}h
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
