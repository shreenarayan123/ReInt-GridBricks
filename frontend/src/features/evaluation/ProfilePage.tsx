import { useByHour, useSeries } from "../../api/client";
import { PageHeader } from "../../components/AppShell";
import { Panel } from "../../components/Panel";
import type { UrlState } from "../../lib/urlState";
import { ActualsCaveat, EvaluationControls } from "./EvaluationControls";
import { HourChart, Histogram } from "./charts";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void; onOpenNotes: () => void };

export function ProfilePage({ state, update, onOpenNotes }: Props) {
  const range = { start: state.start, end: state.end, cutoff: state.cutoff };
  const byHour = useByHour(range);
  const series = useSeries(range);

  return (
    <>
      <PageHeader title="Error profile" subtitle="When the forecast is wrong, and by how much." />
      <EvaluationControls state={state} update={update} />
      <ActualsCaveat onOpenNotes={onOpenNotes} />
      <section className="card">
        <h2>Error by hour of day</h2>
        <p className="muted">Bias shows the direction of the miss (positive = forecast too high); MAE shows its size.</p>
        <Panel query={byHour} empty={(d) => (d.hours.length === 0 ? "No data in this range." : null)}>
          {(d) => <HourChart d={d} />}
        </Panel>
      </section>
      <section className="card">
        <h2>Error distribution</h2>
        <p className="muted">How many slots fell in each error band. A wide, one-sided spread means a larger buffer is needed.</p>
        <Panel query={series} empty={(d) => (d.points.length === 0 ? "No data in this range." : null)}>
          {(d) => <Histogram d={d} />}
        </Panel>
      </section>
    </>
  );
}
