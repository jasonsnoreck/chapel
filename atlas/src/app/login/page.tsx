import { signIn, signUp } from "@/lib/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; notice?: string; next?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Atlas</h1>
        <p className="mb-6 text-sm text-muted">Internal idea, project & decision operating system.</p>

        {searchParams.notice && (
          <p className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {searchParams.notice}
          </p>
        )}
        {searchParams.error && (
          <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {searchParams.error}
          </p>
        )}

        <form action={signIn} className="card space-y-3">
          <input type="hidden" name="next" value={searchParams.next ?? "/"} />
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Email</label>
            <input className="input" type="email" name="email" required autoComplete="email" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Password</label>
            <input className="input" type="password" name="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn w-full">
            Sign in
          </button>
        </form>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted">First time? Create the founder account</summary>
          <form action={signUp} className="card mt-2 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email</label>
              <input className="input" type="email" name="email" required autoComplete="email" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Password</label>
              <input className="input" type="password" name="password" required minLength={6} autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-secondary w-full">
              Create account
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
