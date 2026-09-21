"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MandateStatus } from "@/lib/types";

const STATUSES: MandateStatus[] = ["draft", "proposed", "under_review", "active", "completed", "terminated"];

export default function MandateStatusSelect({
  value,
  action,
}: {
  value: MandateStatus;
  action: (status: MandateStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as MandateStatus;
        startTransition(async () => {
          await action(next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
