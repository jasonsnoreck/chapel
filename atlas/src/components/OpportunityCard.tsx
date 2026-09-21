import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import AttentionBadge from "@/components/AttentionBadge";

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link href={`/opportunities/${opportunity.id}`} className="card block hover:border-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{opportunity.title}</div>
          <div className="mt-0.5 line-clamp-2 text-sm text-muted">
            {opportunity.short_description || opportunity.full_description || "No description yet."}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={opportunity.status} />
          <AttentionBadge attention={opportunity.attention} />
        </div>
      </div>
      {opportunity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="badge">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
