import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";

/**
 * Loading / error / empty handling for a query. When refetching, the previous data stays on
 * screen (dimmed) instead of flashing a spinner.
 */
export function Panel<T>({ query, empty, children }: {
  query: UseQueryResult<T>;
  empty?: (data: T) => ReactNode | null;
  children: (data: T) => ReactNode;
}) {
  if (query.isError) {
    const e = query.error;
    const msg = e instanceof ApiError && e.status === 404 ? e.message : `Could not load data: ${e.message}`;
    return <div className="state state-error" role="alert">{msg}</div>;
  }
  if (query.data === undefined) return <div className="state" aria-busy="true">Loading…</div>;
  const emptyMsg = empty?.(query.data);
  if (emptyMsg) return <div className="state">{emptyMsg}</div>;
  return (
    <div className={query.isFetching ? "refreshing" : undefined} aria-busy={query.isFetching}>
      {children(query.data)}
    </div>
  );
}
