import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { components } from "./schema";

export type Decision = components["schemas"]["DecisionResponse"];
export type Series = components["schemas"]["SeriesResponse"];
export type Summary = components["schemas"]["Summary"];

// Build-time setting; a trailing slash is dropped so paths join cleanly.
const BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}${path}?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

// Previous data stays on screen while new data loads; 404 means "no forecast", so don't retry it.
const opts = {
  placeholderData: keepPreviousData,
  retry: (n: number, e: Error) => !(e instanceof ApiError && e.status < 500) && n < 2,
  staleTime: 60_000,
};

export const useDecision = (p: { date: string; slot: string; cutoff: string; days: number }) =>
  useQuery({
    queryKey: ["decision", p],
    queryFn: () => get<Decision>("/v1/decision",
      { delivery_date: p.date, slot: p.slot, cutoff: p.cutoff, days: p.days }),
    ...opts,
  });

type Range = { start: string; end: string; cutoff: string };

export const useSeries = (p: Range) =>
  useQuery({ queryKey: ["series", p], queryFn: () => get<Series>("/v1/series", p), ...opts });

export const useSummary = (p: Range) =>
  useQuery({ queryKey: ["summary", p], queryFn: () => get<Summary>("/v1/errors/summary", p), ...opts });

