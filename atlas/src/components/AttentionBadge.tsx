const LABELS: Record<string, string> = {
  now: "Now",
  later: "Later",
  watch: "Watch",
  archived: "Archived",
};

const STYLES: Record<string, string> = {
  now: "bg-accent text-white border-accent",
  later: "border-line text-muted",
  watch: "border-blue-300 text-blue-700",
  archived: "border-line text-muted",
};

export default function AttentionBadge({ attention }: { attention: string }) {
  return (
    <span className={`badge ${STYLES[attention] ?? "border-line text-muted"}`}>
      {LABELS[attention] ?? attention}
    </span>
  );
}
