import { useCallback, useEffect, useState } from "react";

export type View = "decision" | "overview" | "profile" | "compare" | "notes";
export const VIEWS: View[] = ["decision", "overview", "profile", "compare", "notes"];

export interface UrlState {
  view: View;
  date: string;     // delivery date
  slot: string;     // HH:MM
  cutoff: string;   // HH:MM, decision time on the day before delivery
  days: number;     // history days
  start: string;    // evaluation range
  end: string;
  compare: string;  // second cutoff for the comparison panel
}

export const DEFAULTS: UrlState = {
  view: "decision", date: "2026-01-14", slot: "12:00", cutoff: "09:20", days: 7,
  start: "2026-01-02", end: "2026-02-01", compare: "19:00",
};

const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string | null): s is string => !!s && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

// "evaluation" was the single evaluation page before it was split into tabs; keep old links working.
const parseView = (v: string | null): View =>
  v === "evaluation" ? "overview" : VIEWS.find((x) => x === v) ?? "decision";

/** Invalid or missing values fall back to defaults, so a bad link never breaks the page. */
export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  const days = Number(p.get("days"));
  return {
    view: parseView(p.get("view")),
    date: isDate(p.get("date")) ? p.get("date")! : DEFAULTS.date,
    slot: isTime(p.get("slot")) ? p.get("slot")! : DEFAULTS.slot,
    cutoff: isTime(p.get("cutoff")) ? p.get("cutoff")! : DEFAULTS.cutoff,
    days: Number.isInteger(days) && days >= 1 && days <= 30 ? days : DEFAULTS.days,
    start: isDate(p.get("start")) ? p.get("start")! : DEFAULTS.start,
    end: isDate(p.get("end")) ? p.get("end")! : DEFAULTS.end,
    compare: isTime(p.get("compare")) ? p.get("compare")! : DEFAULTS.compare,
  };
}

export function toSearch(state: UrlState): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) p.set(k, String(v));
  return `?${p.toString()}`;
}

/** Controls live in the query string, so any view can be shared as a link. */
export function useUrlState(): [UrlState, (patch: Partial<UrlState>) => void] {
  const [state, setState] = useState(() => parseUrlState(window.location.search));

  useEffect(() => {
    const onPop = () => setState(parseUrlState(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch: Partial<UrlState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      window.history.replaceState(null, "", toSearch(next));
      return next;
    });
  }, []);

  return [state, update];
}
