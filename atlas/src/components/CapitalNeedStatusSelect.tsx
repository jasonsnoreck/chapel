"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CapitalNeedStatus } from "@/lib/types";

const STATUSES: CapitalNeedStatus[] = ["draft", "open", "partially_met", "met", "withdrawn"];

export default function CapitalNeedStatusSelect({
  value,
  action,
}: {
  value: CapitalNeedStatus;
  action: (status: CapitalNeedStatus) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      className="input w-auto py-1 text-xs"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as CapitalNeedStatus;
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
