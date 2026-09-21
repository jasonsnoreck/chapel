const STATUS_LABELS: Record<string, string> = {
  captured: "Captured",
  evaluating: "Evaluating",
  approved: "Approved",
  active_project: "Active Project",
  graduated: "Graduated",
  killed: "Killed",
  archived: "Archived",
  active: "Active",
  paused: "Paused",
};

const STATUS_STYLES: Record<string, string> = {
  captured: "border-line text-muted",
  evaluating: "border-amber-300 text-amber-700",
  approved: "border-blue-300 text-blue-700",
  active_project: "border-accent text-accent",
  active: "border-accent text-accent",
  graduated: "border-emerald-300 text-emerald-700",
  killed: "border-red-300 text-red-700",
  archived: "border-line text-muted",
  paused: "border-amber-300 text-amber-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? "border-line text-muted"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
