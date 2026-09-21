"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function StatusControl<T extends string>({
  id,
  value,
  options,
  action,
  label,
}: {
  id: string;
  value: T;
  options: T[];
  action: (id: string, value: T) => Promise<void>;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        className="input w-auto py-1"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as T;
          startTransition(async () => {
            await action(id, next);
            router.refresh();
          });
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
