import type { ReactNode } from "react";
import type { View } from "../lib/urlState";

type Item = { id: View; label: string; icon: string };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Decide", items: [{ id: "decision", label: "Decision", icon: "M12 3v18M5 10l7-7 7 7" }] },
  {
    title: "Evaluate",
    items: [
      { id: "overview", label: "Overview", icon: "M3 17l5-6 4 4 8-10" },
      { id: "profile", label: "Error profile", icon: "M5 20V10M12 20V4M19 20v-7" },
      { id: "compare", label: "Cutoff comparison", icon: "M4 7h16M4 17h16M8 3v8M16 13v8" },
    ],
  },
  { title: "Info", items: [{ id: "notes", label: "Data notes", icon: "M12 8v.01M12 11v6M3 12a9 9 0 1018 0 9 9 0 10-18 0" }] },
];

export function AppShell({ view, onNavigate, children }: {
  view: View; onNavigate: (v: View) => void; children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">W</span>
          <div>
            <div className="brand-name">Wind Forecast</div>
            <div className="brand-sub">Error tool · GB</div>
          </div>
        </div>
        <nav aria-label="Main">
          {GROUPS.map((g) => (
            <div key={g.title} className="nav-group">
              <div className="nav-title">{g.title}</div>
              {g.items.map((it) => (
                <button key={it.id} className={view === it.id ? "nav-item nav-on" : "nav-item"}
                  aria-current={view === it.id ? "page" : undefined} onClick={() => onNavigate(it.id)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={it.icon} />
                  </svg>
                  <span>{it.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">Elexon WINDFOR vs FUELHH<br />Jan 2026 · times in UK time</div>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
