import type { ReactNode } from "react";

export function KpiCard({ label, value, hint, info }: {
  label: string; value: ReactNode; hint?: string; info?: ReactNode;
}) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}{info}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}
