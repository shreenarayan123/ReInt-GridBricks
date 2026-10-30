import type { UrlState } from "../lib/urlState";
import { CutoffInput } from "./CutoffInput";

/** Range and decision-time controls shared by the evaluation pages (they live in the URL). */
export function RangeFilters({ state, update, showCompare = false }: {
  state: UrlState; update: (p: Partial<UrlState>) => void; showCompare?: boolean;
}) {
  return (
    <>
      <label className="field">
        <span>From</span>
        <input type="date" value={state.start} onChange={(e) => e.target.value && update({ start: e.target.value })} />
      </label>
      <label className="field">
        <span>To</span>
        <input type="date" value={state.end} onChange={(e) => e.target.value && update({ end: e.target.value })} />
      </label>
      <CutoffInput label="Decision time" value={state.cutoff} onChange={(cutoff) => update({ cutoff })} />
      {showCompare && <CutoffInput label="Compare with" value={state.compare} onChange={(compare) => update({ compare })} />}
    </>
  );
}
