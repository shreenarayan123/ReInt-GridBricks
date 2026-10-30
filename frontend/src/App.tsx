import { AppShell, PageHeader } from "./components/AppShell";
import { DecisionView } from "./features/decision/DecisionView";
import { ComparePage } from "./features/evaluation/ComparePage";
import { OverviewPage } from "./features/evaluation/OverviewPage";
import { ProfilePage } from "./features/evaluation/ProfilePage";
import { NotesPage } from "./features/notes/NotesPage";
import { useUrlState } from "./lib/urlState";

export default function App() {
  const [state, update] = useUrlState();
  const openNotes = () => update({ view: "notes" });

  return (
    <AppShell view={state.view} onNavigate={(view) => update({ view })}>
      {state.view === "decision" && (
        <>
          <PageHeader title="Decision" subtitle="The forecast for one delivery slot, and how wrong it has recently been for that slot." />
          <DecisionView state={state} update={update} />
        </>
      )}
      {state.view === "overview" && <OverviewPage state={state} update={update} onOpenNotes={openNotes} />}
      {state.view === "profile" && <ProfilePage state={state} update={update} onOpenNotes={openNotes} />}
      {state.view === "compare" && <ComparePage state={state} update={update} onOpenNotes={openNotes} />}
      {state.view === "notes" && <NotesPage />}
    </AppShell>
  );
}
