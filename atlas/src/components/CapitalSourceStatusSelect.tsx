"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CapitalSourceStatus } from "@/lib/types";

const STATUSES: CapitalSourceStatus[] = ["active", "inactive", "exhausted"];

export default function CapitalSourceStatusSelect({
  value,
  action,
}: {
  value: CapitalSourceStatus;
  action: (status: CapitalSourceStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as CapitalSourceStatus;
        startTransition(async () => {
          await action(next);
          router.refresh();
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
