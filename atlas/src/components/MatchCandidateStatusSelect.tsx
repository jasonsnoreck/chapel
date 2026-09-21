"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MatchCandidateStatus } from "@/lib/types";

const STATUSES: MatchCandidateStatus[] = ["proposed", "founder_reviewed", "dismissed"];

export default function MatchCandidateStatusSelect({
  value,
  action,
}: {
  value: MatchCandidateStatus;
  action: (status: MatchCandidateStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as MatchCandidateStatus;
        startTransition(async () => {
          await action(next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
