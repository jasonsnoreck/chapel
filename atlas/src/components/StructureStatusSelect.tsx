"use client";

import { useTransition } from "react";
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
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as StructureReviewStatus;
        startTransition(async () => {
          await action(next);
          router.refresh();
        });
      }}
    >
      {REVIEW_STATUSES.map((rs) => (
        <option key={rs} value={rs}>
          {rs.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
