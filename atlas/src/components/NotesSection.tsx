import type { Note, NotableParentType } from "@/lib/types";
import { createNote } from "@/lib/actions/notes";

export default function NotesSection({ notes, parentType, parentId }: { notes: Note[]; parentType: NotableParentType; parentId: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Notes &amp; research</h2>

      <form action={createNote} className="card space-y-2">
        <input type="hidden" name={`${parentType}_id`} value={parentId} />
        <textarea name="body" required rows={2} placeholder="Add a note…" className="input resize-none" />
        <div className="flex items-center justify-between">
          <select name="kind" defaultValue="note" className="input w-auto py-1 text-xs">
            <option value="note">Note</option>
            <option value="research">Research</option>
          </select>
          <button type="submit" className="btn-secondary">
            Add
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="card">
              <div className="mb-1 flex items-center gap-2">
                <span className="badge">{n.kind}</span>
                <span className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
