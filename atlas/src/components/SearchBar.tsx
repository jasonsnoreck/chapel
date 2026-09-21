"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Search Atlas…"
        className="w-48 rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </form>
  );
}
