import { useSeries, useSummary } from "../../api/client";
import { PageHeader } from "../../components/AppShell";
import { Panel } from "../../components/Panel";
import type { UrlState } from "../../lib/urlState";
import { ActualsCaveat, EvaluationControls } from "./EvaluationControls";
import { Kpis, MainChart } from "./charts";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void; onOpenNotes: () => void };

export function OverviewPage({ state, update, onOpenNotes }: Props) {
  const range = { start: state.start, end: state.end, cutoff: state.cutoff };
  const summary = useSummary(range);
  const series = useSeries(range);

  return (
    <>
      <PageHeader title="Overview" subtitle="How the forecast a buyer had at decision time compared with what the wind actually did." />
      <EvaluationControls state={state} update={update} />
      <ActualsCaveat onOpenNotes={onOpenNotes} />
      <Panel query={summary}>{(s) => <Kpis s={s} />}</Panel>
      <section className="card">
        <h2>Actual vs forecast</h2>
        <p className="muted">Drag the slider below the chart, or scroll over it, to zoom in on a period.</p>
        <Panel query={series} empty={(d) => (d.points.length === 0 ? "No forecasts in this range." : null)}>
          {(d) => <MainChart d={d} />}
        </Panel>
      </section>
    </>
  );
}
