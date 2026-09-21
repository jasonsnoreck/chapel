import { signIn, signUp } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; notice?: string; next?: string };
}) {
  const supabase = createClient();
  const { data: founderExists } = await supabase.rpc("founder_exists");

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

        {founderExists ? (
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
        ) : (
          <div className="space-y-3">
            <p className="rounded-md border border-line bg-white px-3 py-2 text-sm text-muted">
              Atlas has no founder account yet. Set one up below — this only works once; after this
              account is created, Atlas becomes single-user and no further signups are possible.
            </p>
            <form action={signUp} className="card space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Email</label>
                <input className="input" type="email" name="email" required autoComplete="email" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Password</label>
                <input className="input" type="password" name="password" required minLength={6} autoComplete="new-password" />
              </div>
              <button type="submit" className="btn w-full">
                Create the founder account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
