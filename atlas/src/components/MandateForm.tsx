import { createMandate } from "@/lib/actions/investors";
import type { ApprovedStructure, Asset, Business, Opportunity, Project } from "@/lib/types";

const CONTRIBUTION_TYPES = [
  ["cash", "Cash"],
  ["debt_capacity", "Debt capacity"],
  ["business", "Business"],
  ["real_estate", "Real estate"],
  ["equipment", "Equipment"],
  ["customers_distribution", "Customers / distribution"],
  ["expertise", "Expertise"],
  ["labor", "Labor"],
  ["relationships", "Relationships"],
  ["intellectual_property", "Intellectual property"],
  ["other", "Other"],
  ["combination", "Combination"],
] as const;

function CheckboxRow({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} className="h-4 w-4 rounded border-line" />
      {label}
    </label>
  );
}

export default function MandateForm({
  investorProfileId,
  opportunities,
  projects,
  businesses,
  assets,
  structures,
}: {
  investorProfileId: string;
  opportunities: Opportunity[];
  projects: Project[];
  businesses: Business[];
  assets: Asset[];
  structures: ApprovedStructure[];
}) {
  return (
    <form action={createMandate.bind(null, investorProfileId)} className="space-y-5">
      <p className="rounded-md bg-paper px-3 py-2 text-xs text-muted">
        This is an internal configuration tool for modeling a possible investment. It does not
        itself create legally binding terms — see Atlas principles: no structure here is
        "Approved" until a qualified professional reviews it.
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Target</label>
        <select className="input" name="target" required defaultValue="atlas">
          <option value="atlas">Atlas itself</option>
          <option value="other">Other / future vehicle</option>
          {opportunities.length > 0 && (
            <optgroup label="Opportunities">
              {opportunities.map((o) => (
                <option key={o.id} value={`opportunity:${o.id}`}>
                  {o.title}
                </option>
              ))}
            </optgroup>
          )}
          {projects.length > 0 && (
            <optgroup label="Projects">
              {projects.map((p) => (
                <option key={p.id} value={`project:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
          {businesses.length > 0 && (
            <optgroup label="Businesses">
              {businesses.map((b) => (
                <option key={b.id} value={`business:${b.id}`}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          )}
          {assets.length > 0 && (
            <optgroup label="Assets">
              {assets.map((a) => (
                <option key={a.id} value={`asset:${a.id}`}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Target note</label>
        <input className="input" name="target_note" placeholder="e.g. name of the future vehicle" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Investment amount ($)</label>
          <input className="input" name="investment_amount" type="number" step="0.01" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Investment type (conceptual)</label>
          <input className="input" name="investment_type" placeholder="e.g. preferred equity" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Contribution types</label>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-line p-3 sm:grid-cols-3">
          {CONTRIBUTION_TYPES.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="contribution_types" value={value} className="h-4 w-4 rounded border-line" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Contribution notes</label>
        <textarea className="input" name="contribution_notes" rows={2} placeholder="No automatic valuation of non-cash contributions." />
      </div>

      <fieldset className="rounded-md border border-line p-3">
        <legend className="px-1 text-xs font-semibold uppercase text-muted">Economics</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          <CheckboxRow name="economics_equity" label="Equity" />
          <CheckboxRow name="economics_preferred_economics" label="Preferred economics" />
          <CheckboxRow name="economics_revenue_participation" label="Revenue participation" />
          <CheckboxRow name="economics_profit_participation" label="Profit participation" />
          <CheckboxRow name="economics_debt" label="Debt" />
          <CheckboxRow name="economics_hybrid" label="Hybrid" />
          <CheckboxRow name="economics_other" label="Other" />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-line p-3">
        <legend className="px-1 text-xs font-semibold uppercase text-muted">Control</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          <CheckboxRow name="control_management" label="Management" />
          <CheckboxRow name="control_major_event_approval" label="Major-event approval" />
          <CheckboxRow name="control_ordinary_voting" label="Ordinary voting" />
          <CheckboxRow name="control_board_seat" label="Board seat" />
          <CheckboxRow name="control_governance_rights" label="Governance rights" />
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Involvement level (relationship classification, not a legal one)
        </label>
        <select className="input" name="involvement" defaultValue="">
          <option value="">Unspecified</option>
          <option value="financial">Financial</option>
          <option value="informed">Informed</option>
          <option value="advisory">Advisory</option>
          <option value="operating">Operating</option>
          <option value="strategic_partner">Strategic partner</option>
        </select>
      </div>

      <fieldset className="rounded-md border border-line p-3">
        <legend className="px-1 text-xs font-semibold uppercase text-muted">Liquidity (internal modeling only)</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          <CheckboxRow name="liquidity_fixed_maturity" label="Fixed maturity" />
          <CheckboxRow name="liquidity_company_buyback" label="Company buyback" />
          <CheckboxRow name="liquidity_atlas_buyback" label="Atlas buyback" />
          <CheckboxRow name="liquidity_underlying_sale" label="Underlying business sale" />
          <CheckboxRow name="liquidity_asset_sale" label="Asset sale" />
          <CheckboxRow name="liquidity_refinancing" label="Refinancing" />
          <CheckboxRow name="liquidity_secondary_transfer" label="Secondary transfer" />
          <CheckboxRow name="liquidity_distribution" label="Distribution" />
          <CheckboxRow name="liquidity_negotiated_exit" label="Negotiated exit" />
          <CheckboxRow name="liquidity_no_defined_liquidity" label="No defined liquidity" />
        </div>
      </fieldset>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Liquidity note</label>
        <textarea className="input" name="liquidity_note" rows={2} placeholder="Not a promise of liquidity or returns." />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Information access</label>
        <select className="input" name="information" defaultValue="">
          <option value="">Unspecified</option>
          <option value="standard">Standard</option>
          <option value="enhanced">Enhanced</option>
          <option value="strategic">Strategic</option>
          <option value="deal_specific">Deal-specific</option>
          <option value="atlas_partner">Atlas Partner</option>
        </select>
      </div>

      <fieldset className="rounded-md border border-line p-3">
        <legend className="px-1 text-xs font-semibold uppercase text-muted">Atlas access / network privileges</legend>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          <CheckboxRow name="atlas_access_partner_network" label="Partner network" />
          <CheckboxRow name="atlas_access_office" label="Office / workspace" />
          <CheckboxRow name="atlas_access_meetings" label="Atlas meetings" />
          <CheckboxRow name="atlas_access_events" label="Atlas events" />
          <CheckboxRow name="atlas_access_introductions" label="Introductions" />
          <CheckboxRow name="atlas_access_educational_sessions" label="Educational sessions" />
          <CheckboxRow name="atlas_access_deal_discussions" label="Deal discussions" />
          <CheckboxRow name="atlas_access_shared_resources" label="Shared resources" />
          <CheckboxRow name="atlas_access_other" label="Other" />
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Term</label>
          <input className="input" name="term" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Approved structure</label>
          <select className="input" name="approved_structure_id" defaultValue="">
            <option value="">None selected</option>
            {structures.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.review_status.replace("_", " ")})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Special conditions</label>
        <textarea className="input" name="special_conditions" rows={2} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Documents note</label>
        <textarea className="input" name="documents_note" rows={2} placeholder="Reference only — no document execution in this version." />
      </div>

      <button type="submit" className="btn">
        Add mandate
      </button>
    </form>
  );
}
