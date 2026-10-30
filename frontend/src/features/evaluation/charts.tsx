import { useMemo } from "react";
import type { ByHour, Series, Summary } from "../../api/client";
import { Chart, type ChartOption } from "../../components/Chart";
import { KpiCard } from "../../components/KpiCard";
import { fmtMw, fmtSignedMw } from "../../lib/format";
import { histogram } from "../../lib/stats";

const FORECAST = "#b45309";
const ACTUAL = "#1d4ed8";
const NEUTRAL = "#64748b";
const BIN_MW = 1000;

export function Kpis({ s }: { s: Summary }) {
  return (
    <div className="kpis">
      <KpiCard label="Bias" value={fmtSignedMw(s.bias_mw)} hint="mean of forecast − actual" />
      <KpiCard label="MAE" value={fmtMw(s.mae_mw)} hint="mean absolute error" />
      <KpiCard label="RMSE" value={fmtMw(s.rmse_mw)} hint="penalises large misses" />
      <KpiCard label="P90" value={fmtMw(s.p90_abs_mw)} hint={`absolute error, n = ${s.n}`} />
    </div>
  );
}

export function MainChart({ d }: { d: Series }) {
  const option = useMemo<ChartOption>(() => ({
    grid: { left: 64, right: 16, top: 36, bottom: 70 },
    legend: { top: 0 },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtMw(v) },
    xAxis: { type: "time" },
    yAxis: { type: "value", name: "MW", nameGap: 8 },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 24, bottom: 14 }],
    series: [
      { name: "Forecast", type: "line", showSymbol: false, lineStyle: { width: 1.5, color: FORECAST }, itemStyle: { color: FORECAST },
        data: d.points.map((p) => [p.start_time, p.forecast_mw]) },
      { name: "Actual", type: "line", showSymbol: false, lineStyle: { width: 1.5, color: ACTUAL }, itemStyle: { color: ACTUAL },
        data: d.points.map((p) => [p.start_time, p.actual_mw]) },
    ],
  }), [d]);
  return <Chart option={option} height={420} label="Actual and forecast wind generation over time" />;
}

const hourLabels = (d: ByHour) => d.hours.map((h) => `${String(h.hour).padStart(2, "0")}:00`);

export function HourChart({ d }: { d: ByHour }) {
  const option = useMemo<ChartOption>(() => ({
    grid: { left: 64, right: 16, top: 36, bottom: 28 },
    legend: { top: 0 },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtSignedMw(v) },
    xAxis: { type: "category", data: hourLabels(d) },
    yAxis: { type: "value", name: "MW", nameGap: 8 },
    series: [
      { name: "Bias", type: "bar", itemStyle: { color: FORECAST }, data: d.hours.map((h) => Math.round(h.bias_mw ?? 0)) },
      { name: "MAE", type: "bar", itemStyle: { color: NEUTRAL }, data: d.hours.map((h) => Math.round(h.mae_mw ?? 0)) },
    ],
  }), [d]);
  return <Chart option={option} height={320} label="Forecast bias and mean absolute error by hour of day" />;
}

/** MAE by hour for two cutoffs side by side. */
export function HourCompareChart({ a, b, early, late }: { a: ByHour; b: ByHour; early: string; late: string }) {
  const option = useMemo<ChartOption>(() => ({
    grid: { left: 64, right: 16, top: 36, bottom: 28 },
    legend: { top: 0 },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtMw(v) },
    xAxis: { type: "category", data: hourLabels(a) },
    yAxis: { type: "value", name: "MAE (MW)", nameGap: 8 },
    series: [
      { name: early, type: "bar", itemStyle: { color: FORECAST }, data: a.hours.map((h) => Math.round(h.mae_mw ?? 0)) },
      { name: late, type: "bar", itemStyle: { color: ACTUAL }, data: b.hours.map((h) => Math.round(h.mae_mw ?? 0)) },
    ],
  }), [a, b, early, late]);
  return <Chart option={option} height={320} label="Mean absolute error by hour for two decision times" />;
}

export function Histogram({ d }: { d: Series }) {
  const option = useMemo<ChartOption>(() => {
    const h = histogram(d.points.flatMap((p) => (p.error_mw == null ? [] : [p.error_mw])), BIN_MW);
    return {
      grid: { left: 52, right: 16, top: 16, bottom: 44 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: h.labels, name: `error (MW), ${BIN_MW} MW bins from label`, nameLocation: "middle", nameGap: 28 },
      yAxis: { type: "value", name: "slots", nameGap: 8 },
      series: [{ type: "bar", barCategoryGap: "10%", itemStyle: { color: NEUTRAL }, data: h.counts }],
    };
  }, [d]);
  return <Chart option={option} height={320} label="Distribution of forecast errors" />;
}

export function Comparison({ a, b, early, late }: { a: Summary; b: Summary; early: string; late: string }) {
  const rows: [string, (s: Summary) => string][] = [
    ["Bias", (s) => fmtSignedMw(s.bias_mw)],
    ["MAE", (s) => fmtMw(s.mae_mw)],
    ["RMSE", (s) => fmtMw(s.rmse_mw)],
    ["P90 absolute error", (s) => fmtMw(s.p90_abs_mw)],
  ];
  const gain = a.mae_mw != null && b.mae_mw != null ? a.mae_mw - b.mae_mw : null;
  return (
    <>
      <table>
        <thead><tr><th>Metric</th><th>{early}</th><th>{late}</th></tr></thead>
        <tbody>{rows.map(([name, f]) => <tr key={name}><td>{name}</td><td>{f(a)}</td><td>{f(b)}</td></tr>)}</tbody>
      </table>
      {gain != null && (
        <p className="callout">
          {gain > 0
            ? `A ${late} decision has a mean absolute error ${fmtMw(gain)} lower than ${early}: the value of the fresher forecast.`
            : `A ${late} decision is not more accurate than ${early} on this range (MAE difference ${fmtSignedMw(gain)}).`}
        </p>
      )}
    </>
  );
}
