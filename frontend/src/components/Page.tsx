import type { ReactNode } from "react";

/** The scrolling content area: an optional sticky filter bar, then the page body. */
export function Page({ filters, children }: { filters?: ReactNode; children: ReactNode }) {
  return (
    <div className="page">
      {filters && <div className="filters">{filters}</div>}
      <div className="page-body">{children}</div>
    </div>
  );
}
