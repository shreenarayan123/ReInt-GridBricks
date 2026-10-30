import { useSeries, useSummary } from "../../api/client";
import { Boundary, Skeleton } from "../../components/Boundary";
import { InfoTip } from "../../components/InfoTip";
import { KpiCard } from "../../components/KpiCard";
import { Page } from "../../components/Page";
import { RangeFilters } from "../../components/RangeFilters";
import { SignedMw } from "../../components/SignedMw";
import { fmtMw } from "../../lib/format";
import type { UrlState } from "../../lib/urlState";
import { CutoffCard } from "./CutoffCard";
import { MainChart } from "./charts";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void };

const KpiSkeleton = () => (
  <>
    {[0, 1, 2].map((i) => <div key={i} className="kpi"><Skeleton className="sk-line" /><Skeleton className="sk-kpi" /></div>)}
  </>
);

export function OverviewPage({ state, update }: Props) {
  const range = { start: state.start, end: state.end, cutoff: state.cutoff };
  const summary = useSummary(range);
  const series = useSeries(range);

  return (
    <Page filters={<RangeFilters state={state} update={update} showCompare />}>
      <div className="kpi-row">
        <Boundary query={summary} skeleton={<KpiSkeleton />} className="kpi-span">
          {(s) => (
            <>
              <KpiCard label="Bias" value={<SignedMw mw={s.bias_mw} />} hint="mean of forecast − actual"
                info={
                  <InfoTip label="About the bias">
                    Bias depends on which actuals you use (FUELHH here). Against Elexon's AGWS series the same
                    forecast would read about 1 GW low instead of 1.7 GW high, so trust the sign of the bias
                    less than the size of the errors (MAE, P90).
                  </InfoTip>
                } />
              <KpiCard label="MAE" value={fmtMw(s.mae_mw)} hint="mean absolute error" />
              <KpiCard label="P90 absolute error" value={fmtMw(s.p90_abs_mw)} hint={`n = ${s.n} slots`} />
            </>
          )}
        </Boundary>
        <CutoffCard state={state} />
      </div>

      <section className="card card-fill" aria-label="Actual vs forecast">
        <div className="card-h">
          <h2>Actual vs forecast</h2>
          <span className="hint">Scroll or drag the slider to zoom</span>
        </div>
        <Boundary query={series} fill skeleton={<Skeleton className="sk-chart" />}
          empty={(d) => (d.points.length === 0 ? "No forecasts in this range." : null)}>
          {(d) => <div className="chart-box"><MainChart d={d} /></div>}
        </Boundary>
      </section>
    </Page>
  );
}
