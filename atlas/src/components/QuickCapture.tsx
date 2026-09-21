"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quickCapture } from "@/lib/actions/opportunities";

export default function QuickCapture() {
  const [pending, startTransition] = useTransition();
  const [justCaptured, setJustCaptured] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await quickCapture(formData);
          formRef.current?.reset();
          setJustCaptured(true);
          router.refresh();
          setTimeout(() => setJustCaptured(false), 2000);
        });
      }}
      className="card"
    >
      <label htmlFor="quick-capture" className="mb-2 block text-sm font-medium text-muted">
        What&rsquo;s on your mind?
      </label>
      <textarea
        id="quick-capture"
        name="text"
        required
        rows={2}
        placeholder="I wonder if…"
        className="input resize-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {justCaptured ? "Captured." : "Captures instantly — no form, no commitment."}
        </span>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Capturing…" : "Capture"}
        </button>
      </div>
    </form>
  );
}
