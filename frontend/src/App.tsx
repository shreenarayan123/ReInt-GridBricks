import { AppShell } from "./components/AppShell";
import { DecisionView } from "./features/decision/DecisionView";
import { HoursPage } from "./features/evaluation/HoursPage";
import { OverviewPage } from "./features/evaluation/OverviewPage";
import { useUrlState } from "./lib/urlState";

export default function App() {
  const [state, update] = useUrlState();

  return (
    <AppShell view={state.view} cutoff={state.cutoff} onNavigate={(view) => update({ view })}>
      {state.view === "decision" && <DecisionView state={state} update={update} />}
      {state.view === "overview" && <OverviewPage state={state} update={update} />}
      {state.view === "hours" && <HoursPage state={state} update={update} />}
    </AppShell>
  );
}
