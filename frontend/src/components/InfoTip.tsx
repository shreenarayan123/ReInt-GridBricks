import { useId, type ReactNode } from "react";

/** Small (i) icon with a tooltip; opens on hover and keyboard focus. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="info">
      <button type="button" className="info-btn" aria-label={label} aria-describedby={id}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" />
        </svg>
      </button>
      <span id={id} role="tooltip" className="info-pop">{children}</span>
    </span>
  );
}
