import type { Experiment } from "@/lib/types";
import { createExperiment, recordExperimentResult } from "@/lib/actions/experiments";

export default function ExperimentsSection({ projectId, experiments }: { projectId: string; experiments: Experiment[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Experiments</h2>

      <details className="card">
        <summary className="cursor-pointer text-sm font-medium">Run a new experiment</summary>
        <form action={createExperiment.bind(null, projectId)} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Hypothesis</label>
            <textarea className="input" name="hypothesis" rows={2} required placeholder="What are we testing?" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Action</label>
            <textarea className="input" name="action" rows={2} placeholder="What will we actually do?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Cost ($)</label>
              <input className="input" name="cost" type="number" step="0.01" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Time (hours)</label>
              <input className="input" name="time_hours" type="number" step="0.5" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Expected result</label>
            <input className="input" name="expected_result" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Date</label>
            <input className="input" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <button type="submit" className="btn">
            Add experiment
          </button>
        </form>
      </details>

      {experiments.length === 0 ? (
        <p className="text-sm text-muted">No experiments yet.</p>
      ) : (
        <div className="space-y-2">
          {experiments.map((e) => (
            <div key={e.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{e.hypothesis}</span>
                <span className="text-xs text-muted">{e.date}</span>
              </div>
              {e.action && <p className="text-sm text-muted">{e.action}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {e.cost != null && <span>Cost: ${e.cost}</span>}
                {e.time_hours != null && <span>Time: {e.time_hours}h</span>}
                {e.expected_result && <span>Expected: {e.expected_result}</span>}
              </div>

              {e.actual_result || e.learning ? (
                <div className="rounded-md bg-paper p-2 text-sm">
                  {e.actual_result && (
                    <p>
                      <span className="font-medium">Actual result:</span> {e.actual_result}
                    </p>
                  )}
                  {e.learning && (
                    <p>
                      <span className="font-medium">Learning:</span> {e.learning}
                    </p>
                  )}
                </div>
              ) : (
                <details>
                  <summary className="cursor-pointer text-xs link-quiet">Record result</summary>
                  <form action={recordExperimentResult.bind(null, e.id, projectId)} className="mt-2 space-y-2">
                    <textarea className="input" name="actual_result" rows={2} placeholder="What actually happened?" />
                    <textarea className="input" name="learning" rows={2} placeholder="What did we learn?" />
                    <button type="submit" className="btn-secondary">
                      Save result
                    </button>
                  </form>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
