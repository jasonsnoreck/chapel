import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { createBusiness } from "@/lib/actions/businesses";

export default async function NewBusinessPage() {
  await requireCapitalEcosystemEnabled();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">New business</h1>
      <form action={createBusiness} className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Name</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
          <textarea className="input" name="description" rows={3} />
        </div>
        <button type="submit" className="btn">
          Create business
        </button>
      </form>
    </div>
  );
}
