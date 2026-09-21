import Link from "next/link";
import QuickCapture from "@/components/QuickCapture";
import StatusBadge from "@/components/StatusBadge";
import { getDashboardData } from "@/lib/queries";

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const { opportunities, projects, recentDecisions, decisionsAwaitingReview } = await getDashboardData();

  const capturedAwaitingReview = opportunities.filter((o) => o.status === "captured");
  const activeProjects = projects.filter((p) => p.status === "active");
  const upcomingReviews = projects
    .filter((p) => p.target_review_date && daysUntil(p.target_review_date) <= 30 && p.status === "active")
    .sort((a, b) => (a.target_review_date! < b.target_review_date! ? -1 : 1));

  const pipeline = [
    { label: "Captured", count: opportunities.filter((o) => o.status === "captured").length, href: "/opportunities?status=captured" },
    { label: "Evaluating", count: opportunities.filter((o) => o.status === "evaluating").length, href: "/opportunities?status=evaluating" },
    { label: "Active", count: activeProjects.length, href: "/projects" },
    { label: "Later", count: opportunities.filter((o) => o.attention === "later").length, href: "/opportunities?attention=later" },
    { label: "Watch", count: opportunities.filter((o) => o.attention === "watch").length, href: "/opportunities?attention=watch" },
  ];

  return (
    <div className="space-y-10">
      <QuickCapture />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Attention</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AttentionTile label="Active projects" count={activeProjects.length} href="/projects" />
          <AttentionTile label="Ideas awaiting review" count={capturedAwaitingReview.length} href="/inbox" />
          <AttentionTile label="Decisions awaiting review" count={decisionsAwaitingReview.length} href="/decisions" />
          <AttentionTile label="Upcoming project reviews" count={upcomingReviews.length} href="/projects" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {pipeline.map((p) => (
            <Link key={p.label} href={p.href} className="card block hover:border-accent">
              <div className="text-2xl font-semibold">{p.count}</div>
              <div className="text-sm text-muted">{p.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Current projects</h2>
          <Link href="/projects" className="text-sm link-quiet">
            View all
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-muted">No active projects yet.</p>
        ) : (
          <div className="card divide-y divide-line p-0">
            {activeProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="truncate text-sm text-muted">{p.next_action || p.objective || "No next action set"}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Recent decisions</h2>
          <Link href="/decisions" className="text-sm link-quiet">
            View all
          </Link>
        </div>
        {recentDecisions.length === 0 ? (
          <p className="text-sm text-muted">No decisions recorded yet.</p>
        ) : (
          <div className="card divide-y divide-line p-0">
            {recentDecisions.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.subject}</span>
                  <span className="text-xs text-muted">{d.decided_at}</span>
                </div>
                <div className="text-sm text-muted">{d.decision}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AttentionTile({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className="card block hover:border-accent">
      <div className="text-2xl font-semibold">{count}</div>
      <div className="text-sm text-muted">{label}</div>
    </Link>
  );
}
