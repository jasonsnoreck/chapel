"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FinancingPositionStatus } from "@/lib/types";

const STATUSES: FinancingPositionStatus[] = ["active", "paid_off", "refinanced_out"];

export default function FinancingPositionStatusSelect({
  value,
  action,
}: {
  value: FinancingPositionStatus;
  action: (status: FinancingPositionStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as FinancingPositionStatus;
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
