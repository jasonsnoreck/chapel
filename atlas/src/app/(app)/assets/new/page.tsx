import { requireCapitalEcosystemEnabled } from "@/lib/featureFlags";
import { createAsset } from "@/lib/actions/assets";
import { getBusinesses, getProjects } from "@/lib/queries";

export default async function NewAssetPage() {
  await requireCapitalEcosystemEnabled();
  const [businesses, projects] = await Promise.all([getBusinesses(), getProjects()]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">New asset</h1>
      <form action={createAsset} className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Name</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
          <textarea className="input" name="description" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Asset type</label>
            <select className="input" name="asset_type" defaultValue="other">
              <option value="real_estate">Real estate</option>
              <option value="equipment">Equipment</option>
              <option value="intellectual_property">Intellectual property</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Ownership</label>
            <select className="input" name="ownership_type" defaultValue="owned">
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
              <option value="licensed">Licensed</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-xs text-muted">
              A leased building a business operates out of should be "leased," not "owned" — it
              isn't collateral Atlas can finance against.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Business (optional)</label>
            <select className="input" name="business_id" defaultValue="">
              <option value="">None</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Project (optional)</label>
            <select className="input" name="project_id" defaultValue="">
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn">
          Create asset
        </button>
      </form>
    </div>
  );
}
