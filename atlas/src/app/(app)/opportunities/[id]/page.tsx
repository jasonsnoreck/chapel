import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AttentionBadge from "@/components/AttentionBadge";
import StatusControl from "@/components/StatusControl";
import NotesSection from "@/components/NotesSection";
import DecisionsList from "@/components/DecisionsList";
import AnalysisPanel from "@/components/AnalysisPanel";
import BusinessPlanAnalysisPanel from "@/components/BusinessPlanAnalysisPanel";
import OpportunityProvenancePanel from "@/components/OpportunityProvenancePanel";
import RelatedItemsPanel from "@/components/RelatedItemsPanel";
import {
  getAnalysesFor,
  getDecisionsFor,
  getNotesFor,
  getOpportunities,
  getOpportunity,
  getProjectByOpportunity,
  getProjects,
  getRelatedItems,
} from "@/lib/queries";
import { getBusinessPlanAnalysesFor, getDiligenceItemsFor, getProvenanceFor } from "@/lib/queries-capital";
import { promoteToProject, setOpportunityAttention, setOpportunityStatus, updateOpportunity } from "@/lib/actions/opportunities";
import type { AttentionState, OpportunityStatus } from "@/lib/types";

const STATUSES: OpportunityStatus[] = [
  "captured",
  "evaluating",
  "approved",
  "active_project",
  "graduated",
  "killed",
  "archived",
];
const ATTENTIONS: AttentionState[] = ["now", "later", "watch", "archived"];
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

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await getOpportunity(params.id);
  if (!opportunity) notFound();

  const [
    notes,
    decisions,
    analyses,
    related,
    project,
    allOpportunities,
    allProjects,
    businessPlanAnalyses,
    provenance,
    diligenceItems,
  ] = await Promise.all([
    getNotesFor("opportunity", opportunity.id),
    getDecisionsFor("opportunity", opportunity.id),
    getAnalysesFor(opportunity.id),
    getRelatedItems("opportunity", opportunity.id),
    getProjectByOpportunity(opportunity.id),
    getOpportunities(),
    getProjects(),
    getBusinessPlanAnalysesFor(opportunity.id),
    getProvenanceFor(opportunity.id),
    getDiligenceItemsFor(opportunity.id),
  ]);

  const hasPlanText = Boolean((opportunity.full_description || opportunity.short_description || "").trim());

  const linkedIds = new Set(related.map((r) => `${r.type}:${r.id}`));
  const candidates = [
    ...allOpportunities
      .filter((o) => o.id !== opportunity.id && !linkedIds.has(`opportunity:${o.id}`))
      .map((o) => ({ type: "opportunity" as const, id: o.id, title: o.title })),
    ...allProjects
      .filter((p) => !linkedIds.has(`project:${p.id}`))
      .map((p) => ({ type: "project" as const, id: p.id, title: p.name })),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={opportunity.status} />
            <AttentionBadge attention={opportunity.attention} />
            <span className="badge">{opportunity.category.replace("_", " ")}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{opportunity.title}</h1>
          {opportunity.short_description && <p className="mt-1 text-muted">{opportunity.short_description}</p>}
          {opportunity.full_description && (
            <p className="mt-3 whitespace-pre-wrap text-sm">{opportunity.full_description}</p>
          )}
          {opportunity.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {opportunity.tags.map((t) => (
                <span key={t} className="badge">
                  {t}
                </span>
              ))}
            </div>
          )}
          {opportunity.next_action && (
            <p className="mt-3 text-sm">
              <span className="font-medium">Next action:</span> {opportunity.next_action}
            </p>
          )}
          {opportunity.founder_assessment && (
            <p className="mt-1 text-sm">
              <span className="font-medium">Founder assessment:</span> {opportunity.founder_assessment}
            </p>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm link-quiet">Edit details</summary>
            <form action={updateOpportunity.bind(null, opportunity.id)} className="card mt-2 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Title</label>
                <input className="input" name="title" defaultValue={opportunity.title} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Short description</label>
                <input className="input" name="short_description" defaultValue={opportunity.short_description ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Full description</label>
                <textarea className="input" name="full_description" rows={4} defaultValue={opportunity.full_description ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Category</label>
                  <select className="input" name="category" defaultValue={opportunity.category}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Source</label>
                  <input className="input" name="source" defaultValue={opportunity.source ?? ""} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Tags (comma separated)</label>
                <input className="input" name="tags" defaultValue={opportunity.tags.join(", ")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Next action</label>
                <input className="input" name="next_action" defaultValue={opportunity.next_action ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Founder assessment</label>
                <textarea className="input" name="founder_assessment" rows={2} defaultValue={opportunity.founder_assessment ?? ""} />
              </div>
              <button type="submit" className="btn">
                Save
              </button>
            </form>
          </details>
        </div>

        <AnalysisPanel opportunityId={opportunity.id} analyses={analyses} />

        <BusinessPlanAnalysisPanel
          opportunityId={opportunity.id}
          hasPlanText={hasPlanText}
          analyses={businessPlanAnalyses}
        />

        <NotesSection notes={notes} parentType="opportunity" parentId={opportunity.id} />
      </div>

      <div className="space-y-8">
        <div className="card space-y-3">
          <StatusControl
            id={opportunity.id}
            value={opportunity.status}
            options={STATUSES}
            action={setOpportunityStatus}
            label="Status"
          />
          <StatusControl
            id={opportunity.id}
            value={opportunity.attention}
            options={ATTENTIONS}
            action={setOpportunityAttention}
            label="Attention"
          />
        </div>

        {project ? (
          <div className="card">
            <p className="text-sm text-muted">Already promoted to a project.</p>
            <Link href={`/projects/${project.id}`} className="link-quiet mt-1 block font-medium">
              {project.name}
            </Link>
          </div>
        ) : (
          <details className="card">
            <summary className="cursor-pointer text-sm font-medium">Promote to project</summary>
            <form action={promoteToProject.bind(null, opportunity.id)} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Project name</label>
                <input className="input" name="name" placeholder={`${opportunity.title} project`} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Objective</label>
                <textarea className="input" name="objective" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Graduation criteria</label>
                <input className="input" name="graduation_criteria" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Kill criteria</label>
                <input className="input" name="kill_criteria" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Why now? (decision reasoning)</label>
                <textarea className="input" name="reasoning" rows={2} />
              </div>
              <button type="submit" className="btn w-full">
                Promote
              </button>
            </form>
          </details>
        )}

        <DecisionsList decisions={decisions} newHref={`/decisions/new?opportunity_id=${opportunity.id}`} />

        <RelatedItemsPanel
          selfType="opportunity"
          selfId={opportunity.id}
          related={related}
          candidates={candidates}
          revalidate={`/opportunities/${opportunity.id}`}
        />

        <OpportunityProvenancePanel
          opportunityId={opportunity.id}
          provenance={provenance}
          diligenceItems={diligenceItems}
        />
      </div>
    </div>
  );
}
