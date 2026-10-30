import { useEffect, useState, type ReactNode } from "react";
import type { View } from "../lib/urlState";

const ICON: Record<View, string> = {
  decision: "M12 20V4M5 11l7-7 7 7",
  overview: "M3 17l5-6 4 4 8-10",
};
const ITEMS: { id: View; label: string }[] = [
  { id: "decision", label: "Decision" },
  { id: "overview", label: "Overview" },
];

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const STORAGE_KEY = "sidebar-collapsed";
const readCollapsed = () => {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
};

/** Fixed dark sidebar (icons only when collapsed; a drawer on small screens) and a slim top bar. */
export function AppShell({ view, onNavigate, children }: {
  view: View; onNavigate: (v: View) => void; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* storage unavailable: keep in memory only */ }
  };

  return (
    <div className={`app${collapsed ? " is-collapsed" : ""}${drawer ? " is-drawer-open" : ""}`}>
      <aside className="sidebar" aria-label="Sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">W</span>
          <div className="brand-text">
            <div className="brand-name">Wind Forecast</div>
            <div className="brand-sub">Error tool · GB</div>
          </div>
        </div>
        <nav aria-label="Main">
          {ITEMS.map((it) => (
            <button key={it.id} className={view === it.id ? "nav-item nav-on" : "nav-item"} title={it.label}
              aria-current={view === it.id ? "page" : undefined}
              onClick={() => { onNavigate(it.id); setDrawer(false); }}>
              <Icon d={ICON[it.id]} />
              <span className="nav-label">{it.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="foot-text">Elexon WINDFOR vs FUELHH<br />Jan 2026 · UK time</div>
          <button className="nav-item collapse-btn" onClick={toggle} aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Icon d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
            <span className="nav-label">Collapse</span>
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Icon d="M4 6h16M4 12h16M4 18h16" />
          </button>
          <h1 className="sr-only">{ITEMS.find((i) => i.id === view)?.label}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
