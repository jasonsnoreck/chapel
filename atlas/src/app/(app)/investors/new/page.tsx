import { createInvestorProfile } from "@/lib/actions/investors";
import { requireInvestorProtocolEnabled } from "@/lib/featureFlags";

export default async function NewInvestorProfilePage() {
  await requireInvestorProtocolEnabled();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New investor profile</h1>
        <p className="text-sm text-muted">
          The persistent relationship — an investor can have multiple investment mandates against
          this one profile.
        </p>
      </div>
      <form action={createInvestorProfile} className="card space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Name</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Entity type</label>
          <select className="input" name="entity_type" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="entity">Entity</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Contact email</label>
            <input className="input" name="contact_email" type="email" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Contact phone</label>
            <input className="input" name="contact_phone" type="tel" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Preferred involvement level</label>
          <select className="input" name="preferred_involvement_level" defaultValue="">
            <option value="">Unspecified</option>
            <option value="financial">Financial</option>
            <option value="informed">Informed</option>
            <option value="advisory">Advisory</option>
            <option value="operating">Operating</option>
            <option value="strategic_partner">Strategic partner</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Preferred reporting frequency</label>
            <input className="input" name="preferred_reporting_frequency" placeholder="e.g. quarterly" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Preferred investment horizon</label>
            <input className="input" name="preferred_investment_horizon" placeholder="e.g. 5+ years" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">General investment interests</label>
          <textarea className="input" name="investment_interests" rows={2} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Capabilities / contributions</label>
          <textarea className="input" name="capabilities_contributions" rows={2} placeholder="What could they bring beyond cash?" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Atlas network preferences</label>
          <textarea className="input" name="atlas_network_preferences" rows={2} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
          <textarea className="input" name="notes" rows={3} />
        </div>
        <button type="submit" className="btn">
          Create profile
        </button>
      </form>
    </div>
  );
}
