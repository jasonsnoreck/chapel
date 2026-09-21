"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DiligenceItemStatus } from "@/lib/types";

const STATUSES: DiligenceItemStatus[] = ["requested", "received", "reviewed", "not_applicable"];

export default function DiligenceItemStatusSelect({
  value,
  action,
}: {
  value: DiligenceItemStatus;
  action: (status: DiligenceItemStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as DiligenceItemStatus;
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
