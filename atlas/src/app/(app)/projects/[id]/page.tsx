import { notFound } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import StatusControl from "@/components/StatusControl";
import NotesSection from "@/components/NotesSection";
import DecisionsList from "@/components/DecisionsList";
import ExperimentsSection from "@/components/ExperimentsSection";
import RelatedItemsPanel from "@/components/RelatedItemsPanel";
import {
  getDecisionsFor,
  getExperimentsFor,
  getNotesFor,
  getOpportunities,
  getOpportunity,
  getProject,
  getProjects,
  getRelatedItems,
} from "@/lib/queries";
import { setProjectStatus, updateProject } from "@/lib/actions/projects";
import type { ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = ["active", "paused", "graduated", "killed"];

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const [notes, decisions, experiments, related, opportunity, allOpportunities, allProjects] = await Promise.all([
    getNotesFor("project", project.id),
    getDecisionsFor("project", project.id),
    getExperimentsFor(project.id),
    getRelatedItems("project", project.id),
    project.opportunity_id ? getOpportunity(project.opportunity_id) : Promise.resolve(null),
    getOpportunities(),
    getProjects(),
  ]);

  const linkedIds = new Set(related.map((r) => `${r.type}:${r.id}`));
  const candidates = [
    ...allOpportunities
      .filter((o) => !linkedIds.has(`opportunity:${o.id}`))
      .map((o) => ({ type: "opportunity" as const, id: o.id, title: o.title })),
    ...allProjects
      .filter((p) => p.id !== project.id && !linkedIds.has(`project:${p.id}`))
      .map((p) => ({ type: "project" as const, id: p.id, title: p.name })),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={project.status} />
            {opportunity && (
              <Link href={`/opportunities/${opportunity.id}`} className="text-xs link-quiet">
                from opportunity: {opportunity.title}
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.objective && <p className="mt-1 text-muted">{project.objective}</p>}
          {project.next_action && (
            <p className="mt-3 text-sm">
              <span className="font-medium">Next action:</span> {project.next_action}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
            <span>Started {project.start_date}</span>
            <span>Capital invested: ${project.capital_invested}</span>
            <span>Time invested: {project.time_invested_hours}h</span>
            {project.target_review_date && <span>Review by {project.target_review_date}</span>}
          </div>
          {(project.graduation_criteria || project.kill_criteria) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {project.graduation_criteria && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm">
                  <span className="font-medium">Graduation criteria:</span> {project.graduation_criteria}
                </div>
              )}
              {project.kill_criteria && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm">
                  <span className="font-medium">Kill criteria:</span> {project.kill_criteria}
                </div>
              )}
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm link-quiet">Edit details</summary>
            <form action={updateProject.bind(null, project.id)} className="card mt-2 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input className="input" name="name" defaultValue={project.name} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Objective</label>
                <textarea className="input" name="objective" rows={2} defaultValue={project.objective ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Capital invested ($)</label>
                  <input className="input" name="capital_invested" type="number" step="0.01" defaultValue={project.capital_invested} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Time invested (hours)</label>
                  <input className="input" name="time_invested_hours" type="number" step="0.5" defaultValue={project.time_invested_hours} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Target review date</label>
                <input className="input" name="target_review_date" type="date" defaultValue={project.target_review_date ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Graduation criteria</label>
                <input className="input" name="graduation_criteria" defaultValue={project.graduation_criteria ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Kill criteria</label>
                <input className="input" name="kill_criteria" defaultValue={project.kill_criteria ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Next action</label>
                <input className="input" name="next_action" defaultValue={project.next_action ?? ""} />
              </div>
              <button type="submit" className="btn">
                Save
              </button>
            </form>
          </details>
        </div>

        <ExperimentsSection projectId={project.id} experiments={experiments} />

        <NotesSection notes={notes} parentType="project" parentId={project.id} />
      </div>

      <div className="space-y-8">
        <div className="card">
          <StatusControl id={project.id} value={project.status} options={STATUSES} action={setProjectStatus} label="Status" />
        </div>

        <DecisionsList decisions={decisions} newHref={`/decisions/new?project_id=${project.id}`} />

        <RelatedItemsPanel
          selfType="project"
          selfId={project.id}
          related={related}
          candidates={candidates}
          revalidate={`/projects/${project.id}`}
        />
      </div>
    </div>
  );
}
