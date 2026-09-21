import { createOpportunity } from "@/lib/actions/opportunities";

const CATEGORIES = [
  "business_idea",
  "acquisition",
  "product",
  "service",
  "asset",
  "technology",
  "partnership",
  "investment",
  "other",
];

export default function NewOpportunityPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">New opportunity</h1>
      <form action={createOpportunity} className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Title</label>
          <input className="input" name="title" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Short description</label>
          <input className="input" name="short_description" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Full description</label>
          <textarea className="input" name="full_description" rows={4} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Category</label>
            <select className="input" name="category" defaultValue="other">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Source</label>
            <input className="input" name="source" placeholder="Where did this come from?" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Tags (comma separated)</label>
          <input className="input" name="tags" />
        </div>
        <button type="submit" className="btn">
          Create opportunity
        </button>
      </form>
    </div>
  );
}
