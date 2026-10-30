import { CutoffInput } from "../../components/CutoffInput";
import type { UrlState } from "../../lib/urlState";

/** Range and cutoff controls shared by the three evaluation pages (they live in the URL). */
export function EvaluationControls({ state, update, showCompare = false }: {
  state: UrlState; update: (p: Partial<UrlState>) => void; showCompare?: boolean;
}) {
  return (
    <div className="toolbar">
      <label className="field">
        <span>From (delivery day)</span>
        <input type="date" value={state.start} onChange={(e) => e.target.value && update({ start: e.target.value })} />
      </label>
      <label className="field">
        <span>To (delivery day)</span>
        <input type="date" value={state.end} onChange={(e) => e.target.value && update({ end: e.target.value })} />
      </label>
      <CutoffInput label="Decision time (UK)" value={state.cutoff} onChange={(cutoff) => update({ cutoff })} />
      {showCompare && <CutoffInput label="Compare with" value={state.compare} onChange={(compare) => update({ compare })} />}
    </div>
  );
}

export function ActualsCaveat({ onOpenNotes }: { onOpenNotes: () => void }) {
  return (
    <div className="note" role="note">
      Bias depends on which actuals you use (FUELHH here).{" "}
      <button className="link" onClick={onOpenNotes}>See Data notes</button>
    </div>
  );
}
