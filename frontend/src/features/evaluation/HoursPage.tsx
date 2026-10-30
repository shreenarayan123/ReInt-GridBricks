import { useByHour } from "../../api/client";
import { Boundary, Skeleton } from "../../components/Boundary";
import { InfoTip } from "../../components/InfoTip";
import { Page } from "../../components/Page";
import { RangeFilters } from "../../components/RangeFilters";
import type { UrlState } from "../../lib/urlState";
import { HourChart } from "./charts";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void };

export function HoursPage({ state, update }: Props) {
  const byHour = useByHour({ start: state.start, end: state.end, cutoff: state.cutoff });

  return (
    <Page filters={<RangeFilters state={state} update={update} />}>
      <section className="card card-fill" aria-label="Bias and MAE by hour">
        <div className="card-h">
          <h2>
            Bias and MAE by hour of day
            <InfoTip label="About the bias">
              Bias depends on which actuals you use (FUELHH here). Against Elexon's AGWS series the same
              forecast would read about 1 GW low instead of 1.7 GW high, so trust the sign of the bias
              less than the size of the errors (MAE, P90).
            </InfoTip>
          </h2>
          <span className="legend">
            <i className="dot dot-over" /> bias, forecast too high <i className="dot dot-under" /> too low <i className="dash" /> MAE
          </span>
        </div>
        <Boundary query={byHour} fill skeleton={<Skeleton className="sk-chart" />}
          empty={(d) => (d.hours.length === 0 ? "No data in this range." : null)}>
          {(d) => <HourChart d={d} />}
        </Boundary>
      </section>
    </Page>
  );
}
