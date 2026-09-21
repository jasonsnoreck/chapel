import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import SearchBar from "@/components/SearchBar";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/projects", label: "Projects" },
  { href: "/decisions", label: "Decisions" },
  { href: "/principles", label: "Principles" },
  { href: "/investors", label: "Investors" },
];

export default function Nav() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Atlas
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-muted hover:bg-paper hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SearchBar />
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
