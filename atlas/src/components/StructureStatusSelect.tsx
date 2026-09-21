"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StructureReviewStatus } from "@/lib/types";

const REVIEW_STATUSES: StructureReviewStatus[] = [
  "draft",
  "internally_designed",
  "professional_review",
  "approved",
  "active",
  "retired",
];

export default function StructureStatusSelect({
  value,
  action,
}: {
  value: StructureReviewStatus;
  action: (status: StructureReviewStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="text-right">
      <select
        className="input w-auto py-1 text-xs"
        value={selected}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as StructureReviewStatus;
          setSelected(next);
          setError(null);
          startTransition(async () => {
            try {
              await action(next);
              router.refresh();
            } catch (err) {
              setSelected(value);
              setError(err instanceof Error ? err.message : "Could not update review status.");
            }
          });
        }}
      >
        {REVIEW_STATUSES.map((rs) => (
          <option key={rs} value={rs}>
            {rs.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 max-w-xs text-xs text-red-700">{error}</p>}
    </div>
  );
}
