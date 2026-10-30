import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export function StateBox({ message, tone = "empty", onRetry, className = "" }: {
  message: string; tone?: "empty" | "error"; onRetry?: () => void; className?: string;
}) {
  return (
    <div className={`state state-${tone} ${className}`} role={tone === "error" ? "alert" : "status"}>
      <span>{message}</span>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}

/**
 * Loading / empty / error handling for one query. While refetching, the previous data stays on
 * screen (dimmed). A 404 means "nothing for this selection": shown as an empty state, not retried.
 */
export function Boundary<T>({ query, skeleton, empty, fill = false, className = "", children }: {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  empty?: (data: T) => string | null;
  /** Take the remaining height of a flex parent (charts). */
  fill?: boolean;
  /** Extra class on the state box, e.g. to span a grid. */
  className?: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isError) {
    const e = query.error;
    if (e instanceof ApiError && e.status === 404) return <StateBox message={e.message} className={className} />;
    return <StateBox tone="error" message={`Could not load data: ${e.message}`} onRetry={() => query.refetch()} className={className} />;
  }
  if (query.data === undefined) return <>{skeleton}</>;
  const emptyMsg = empty?.(query.data);
  if (emptyMsg) return <StateBox message={emptyMsg} className={className} />;
  const cls = `q-wrap${fill ? " q-fill" : ""}${query.isFetching ? " is-fetching" : ""}`;
  return <div className={cls} aria-busy={query.isFetching}>{children(query.data)}</div>;
}
