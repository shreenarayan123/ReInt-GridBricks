import { useMemo } from "react";
import { Brush, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { Series } from "../../api/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../../components/ui/chart";
import { fmtMw, fmtUkDateTime, fmtUkShort } from "../../lib/format";

const mainConfig = {
  forecast: { label: "Forecast", color: "var(--forecast)" },
  actual: { label: "Actual", color: "var(--actual)" },
} satisfies ChartConfig;

const day = (t: number) => fmtUkShort(new Date(t).toISOString());

/** shadcn line chart. Red and orange are reserved for the error's direction, so the two series
 *  use blue and green. The brush under the plot zooms the time range. */
export function MainChart({ d }: { d: Series }) {
  const data = useMemo(
    () => d.points.map((p) => ({ t: new Date(p.start_time).getTime(), forecast: p.forecast_mw, actual: p.actual_mw })),
    [d],
  );
  return (
    <ChartContainer config={mainConfig} label="Actual and forecast wind generation over time">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false}
          tickFormatter={day} minTickGap={48} />
        <YAxis width={56} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toLocaleString("en-GB")} />
        <ChartTooltip content={
          <ChartTooltipContent
            labelFormatter={(t: number) => fmtUkDateTime(new Date(t).toISOString())}
            formatter={(v, key) => (
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `var(--color-${key})` }} />
                <span className="text-muted-foreground">{mainConfig[key as keyof typeof mainConfig].label}</span>
                <span className="ml-auto pl-4 font-medium tabular-nums">{fmtMw(v)}</span>
              </span>
            )} />
        } />
        <Line dataKey="forecast" type="linear" stroke="var(--color-forecast)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line dataKey="actual" type="linear" stroke="var(--color-actual)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Brush dataKey="t" height={22} travellerWidth={8} stroke="var(--neutral)" fill="var(--card)" tickFormatter={day} />
      </LineChart>
    </ChartContainer>
  );
}
