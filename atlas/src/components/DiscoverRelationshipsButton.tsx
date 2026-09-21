"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverRelationshipsButton({
  action,
}: {
  action: () => Promise<{ proposed: number; disclaimer: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ proposed: number; disclaimer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const r = await action();
              setResult(r);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Discovery failed.");
            }
          });
        }}
      >
        {pending ? "Looking for relationships…" : "Discover relationships"}
      </button>
      {result && (
        <p className="mt-2 text-xs text-muted">
          {result.proposed} candidate{result.proposed === 1 ? "" : "s"} proposed for review. {result.disclaimer}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
