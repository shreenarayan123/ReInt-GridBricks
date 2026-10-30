import { useSummary } from "../../api/client";
import { Boundary, Skeleton } from "../../components/Boundary";
import { fmtMw } from "../../lib/format";
import { maeDifference } from "../../lib/insights";
import type { UrlState } from "../../lib/urlState";

/** What a fresher forecast is worth: MAE for the same days at two decision times. */
export function CutoffCard({ state }: { state: UrlState }) {
  const range = { start: state.start, end: state.end };
  const early = useSummary({ ...range, cutoff: state.cutoff });
  const late = useSummary({ ...range, cutoff: state.compare });
  const skeleton = <Skeleton className="sk-kpi" />;

  return (
    <section className="kpi kpi-wide" aria-label="Cutoff comparison">
      <div className="kpi-label">MAE by decision time</div>
      <Boundary query={early} skeleton={skeleton}>
        {(a) => (
          <Boundary query={late} skeleton={skeleton}>
            {(b) => {
              const diff = maeDifference(a.mae_mw, b.mae_mw);
              return (
                <>
                  <div className="cutoff-row">
                    <span><small>{state.cutoff}</small> <strong>{fmtMw(a.mae_mw)}</strong></span>
                    <span className="cutoff-vs">vs</span>
                    <span><small>{state.compare}</small> <strong>{fmtMw(b.mae_mw)}</strong></span>
                  </div>
                  {diff && (
                    <div className="kpi-hint">
                      {diff.better > 0.5
                        ? `${state.compare} is ${fmtMw(diff.better)} better`
                        : `${state.compare} is not more accurate (${diff.text})`}
                    </div>
                  )}
                </>
              );
            }}
          </Boundary>
        )}
      </Boundary>
    </section>
  );
}
