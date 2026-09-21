import Link from "next/link";
import type { RelatableType } from "@/lib/types";
import type { RelatedItem } from "@/lib/queries";
import { createRelationshipFromForm, unlinkItems } from "@/lib/actions/relationships";

const HREF: Record<RelatableType, (id: string) => string> = {
  opportunity: (id) => `/opportunities/${id}`,
  project: (id) => `/projects/${id}`,
  business: (id) => `/opportunities`,
};

export default function RelatedItemsPanel({
  selfType,
  selfId,
  related,
  candidates,
  revalidate,
}: {
  selfType: RelatableType;
  selfId: string;
  related: RelatedItem[];
  candidates: { type: RelatableType; id: string; title: string }[];
  revalidate: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Related Atlas items</h2>

      {related.length === 0 ? (
        <p className="text-sm text-muted">Nothing linked yet.</p>
      ) : (
        <ul className="space-y-1">
          {related.map((r) => (
            <li key={r.relationshipId} className="flex items-center justify-between gap-2 text-sm">
              <Link href={HREF[r.type](r.id)} className="link-quiet truncate">
                {r.title} <span className="text-xs text-muted">({r.type})</span>
              </Link>
              <form action={unlinkItems.bind(null, r.relationshipId, revalidate)}>
                <button type="submit" className="text-xs text-muted hover:text-red-700">
                  Unlink
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 && (
        <form action={createRelationshipFromForm.bind(null, selfType, selfId, revalidate)} className="flex gap-2">
          <select name="target" className="input" required defaultValue="">
            <option value="" disabled>
              Link to…
            </option>
            {candidates.map((c) => (
              <option key={`${c.type}:${c.id}`} value={`${c.type}:${c.id}`}>
                {c.title} ({c.type})
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary shrink-0">
            Link
          </button>
        </form>
      )}
    </div>
  );
}
