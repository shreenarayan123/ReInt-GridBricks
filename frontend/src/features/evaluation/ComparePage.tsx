import { useByHour, useSummary } from "../../api/client";
import { PageHeader } from "../../components/AppShell";
import { Panel } from "../../components/Panel";
import type { UrlState } from "../../lib/urlState";
import { ActualsCaveat, EvaluationControls } from "./EvaluationControls";
import { Comparison, HourCompareChart } from "./charts";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void; onOpenNotes: () => void };

export function ComparePage({ state, update, onOpenNotes }: Props) {
  const early = { start: state.start, end: state.end, cutoff: state.cutoff };
  const late = { ...early, cutoff: state.compare };
  const sumA = useSummary(early);
  const sumB = useSummary(late);
  const hourA = useByHour(early);
  const hourB = useByHour(late);

  return (
    <>
      <PageHeader title="Cutoff comparison" subtitle="What a fresher forecast is worth: the same days, decided at two different times." />
      <EvaluationControls state={state} update={update} showCompare />
      <ActualsCaveat onOpenNotes={onOpenNotes} />
      <section className="card">
        <h2>{state.cutoff} vs {state.compare}</h2>
        <Panel query={sumA}>
          {(a) => <Panel query={sumB}>{(b) => <Comparison a={a} b={b} early={state.cutoff} late={state.compare} />}</Panel>}
        </Panel>
      </section>
      <section className="card">
        <h2>Mean absolute error by hour</h2>
        <Panel query={hourA}>
          {(a) => <Panel query={hourB}>{(b) => <HourCompareChart a={a} b={b} early={state.cutoff} late={state.compare} />}</Panel>}
        </Panel>
      </section>
    </>
  );
}
