import { notFound } from "next/navigation";
import { requireInvestorProtocolEnabled } from "@/lib/featureFlags";
import {
  getApprovedStructures,
  getAssets,
  getBusinesses,
  getInvestorProfile,
  getMandatesFor,
  getNotesFor,
  getOpportunities,
  getProjects,
} from "@/lib/queries";
import { updateInvestorProfile } from "@/lib/actions/investors";
import NotesSection from "@/components/NotesSection";
import MandateForm from "@/components/MandateForm";
import MandatesList from "@/components/MandatesList";

export default async function InvestorProfileDetailPage({ params }: { params: { id: string } }) {
  await requireInvestorProtocolEnabled();

  const investor = await getInvestorProfile(params.id);
  if (!investor) notFound();

  const [mandates, notes, opportunities, projects, businesses, assets, structures] = await Promise.all([
    getMandatesFor(investor.id),
    getNotesFor("investor_profile", investor.id),
    getOpportunities(),
    getProjects(),
    getBusinesses(),
    getAssets(),
    getApprovedStructures(),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="badge">{investor.relationship_status}</span>
            <span className="badge">{investor.entity_type}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{investor.name}</h1>
          {(investor.contact_email || investor.contact_phone) && (
            <p className="mt-1 text-sm text-muted">
              {[investor.contact_email, investor.contact_phone].filter(Boolean).join(" · ")}
            </p>
          )}
          {investor.investment_interests && <p className="mt-3 text-sm">{investor.investment_interests}</p>}
          {investor.capabilities_contributions && (
            <p className="mt-1 text-sm">
              <span className="font-medium">Capabilities / contributions:</span> {investor.capabilities_contributions}
            </p>
          )}
          {investor.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{investor.notes}</p>}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm link-quiet">Edit profile</summary>
            <form action={updateInvestorProfile.bind(null, investor.id)} className="card mt-2 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input className="input" name="name" defaultValue={investor.name} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Entity type</label>
                  <select className="input" name="entity_type" defaultValue={investor.entity_type}>
                    <option value="individual">Individual</option>
                    <option value="entity">Entity</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Relationship status</label>
                  <select className="input" name="relationship_status" defaultValue={investor.relationship_status}>
                    <option value="prospective">Prospective</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Contact email</label>
                  <input className="input" name="contact_email" type="email" defaultValue={investor.contact_email ?? ""} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Contact phone</label>
                  <input className="input" name="contact_phone" type="tel" defaultValue={investor.contact_phone ?? ""} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Preferred involvement level</label>
                <select className="input" name="preferred_involvement_level" defaultValue={investor.preferred_involvement_level ?? ""}>
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
                  <input className="input" name="preferred_reporting_frequency" defaultValue={investor.preferred_reporting_frequency ?? ""} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Preferred investment horizon</label>
                  <input className="input" name="preferred_investment_horizon" defaultValue={investor.preferred_investment_horizon ?? ""} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Investment interests</label>
                <textarea className="input" name="investment_interests" rows={2} defaultValue={investor.investment_interests ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Capabilities / contributions</label>
                <textarea className="input" name="capabilities_contributions" rows={2} defaultValue={investor.capabilities_contributions ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Atlas network preferences</label>
                <textarea className="input" name="atlas_network_preferences" rows={2} defaultValue={investor.atlas_network_preferences ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Qualification status</label>
                <select className="input" name="qualification_status" defaultValue={investor.qualification_status}>
                  <option value="unverified">Unverified</option>
                  <option value="self_attested">Self-attested</option>
                  <option value="professionally_verified">Professionally verified</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
                <textarea className="input" name="notes" rows={3} defaultValue={investor.notes ?? ""} />
              </div>
              <button type="submit" className="btn">
                Save
              </button>
            </form>
          </details>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Investment mandates</h2>
          <MandatesList mandates={mandates} investorProfileId={investor.id} />
          <details className="card">
            <summary className="cursor-pointer text-sm font-medium">Add a mandate</summary>
            <div className="mt-3">
              <MandateForm
                investorProfileId={investor.id}
                opportunities={opportunities}
                projects={projects}
                businesses={businesses}
                assets={assets}
                structures={structures}
              />
            </div>
          </details>
        </div>

        <NotesSection notes={notes} parentType="investor_profile" parentId={investor.id} />
      </div>
    </div>
  );
}
