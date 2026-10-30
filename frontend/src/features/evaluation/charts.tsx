import { useMemo } from "react";
import type { ByHour, Series } from "../../api/client";
import { Chart, type ChartOption } from "../../components/Chart";
import { fmtMw, fmtSignedMw } from "../../lib/format";
import { hourTakeaway } from "../../lib/insights";
import { errorSide } from "../../lib/sign";
import { chartColors } from "../../lib/theme";

const mwTick = (v: number) => v.toLocaleString("en-GB");

/** Forecast in the accent, actual in neutral grey: orange and blue are reserved for the error's direction. */
export function MainChart({ d }: { d: Series }) {
  const option = useMemo<ChartOption>(() => {
    const c = chartColors();
    const line = (name: string, color: string, value: (p: Series["points"][number]) => number | null | undefined) => ({
      name, type: "line", showSymbol: false, lineStyle: { width: 1.5, color }, itemStyle: { color },
      data: d.points.map((p) => [p.start_time, value(p)]),
    });
    return {
      grid: { left: 56, right: 12, top: 30, bottom: 56 },
      legend: { top: 0, right: 0, textStyle: { color: c.text } },
      tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtMw(v) },
      xAxis: { type: "time", axisLabel: { color: c.text } },
      yAxis: { type: "value", axisLabel: { color: c.text, formatter: mwTick }, splitLine: { lineStyle: { color: c.grid } } },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 20, bottom: 8 }],
      series: [line("Forecast", c.accent, (p) => p.forecast_mw), line("Actual", c.neutral, (p) => p.actual_mw)],
    };
  }, [d]);
  return <Chart option={option} label="Actual and forecast wind generation over time" />;
}

/** One chart: bias bars coloured by direction, MAE as a line. */
export function HourChart({ d }: { d: ByHour }) {
  const takeaway = hourTakeaway(d.hours);
  const option = useMemo<ChartOption>(() => {
    const c = chartColors();
    return {
      grid: { left: 56, right: 12, top: 12, bottom: 24 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: d.hours.map((h) => `${String(h.hour).padStart(2, "0")}:00`), axisLabel: { color: c.text }, axisTick: { show: false } },
      yAxis: { type: "value", axisLabel: { color: c.text, formatter: mwTick }, splitLine: { lineStyle: { color: c.grid } } },
      series: [
        {
          name: "Bias", type: "bar", barMaxWidth: 28, tooltip: { valueFormatter: (v: number) => fmtSignedMw(v) },
          data: d.hours.map((h) => ({
            value: Math.round(h.bias_mw ?? 0),
            itemStyle: { color: errorSide(h.bias_mw) === "low" ? c.under : c.over },
          })),
        },
        {
          name: "MAE", type: "line", symbolSize: 6, tooltip: { valueFormatter: (v: number) => fmtMw(v) }, lineStyle: { width: 2, color: c.neutral }, itemStyle: { color: c.neutral },
          data: d.hours.map((h) => Math.round(h.mae_mw ?? 0)),
        },
      ],
    };
  }, [d]);
  return (
    <>
      {takeaway && <p className="takeaway">{takeaway}</p>}
      <div className="chart-box">
        <Chart option={option} label="Forecast bias and mean absolute error by hour of day" />
      </div>
    </>
  );
}
