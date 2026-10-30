import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../../lib/utils";

// shadcn/ui chart primitives (https://ui.shadcn.com/docs/components/chart), trimmed to what the app uses.

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);
const useChart = () => {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer />");
  return ctx;
};

/** Sets --color-<key> from the config, so series can use stroke="var(--color-key)". Fills its parent. */
export function ChartContainer({ config, className, children, label }: {
  config: ChartConfig;
  label: string;
  className?: string;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const style = Object.fromEntries(
    Object.entries(config).filter(([, v]) => v.color).map(([k, v]) => [`--color-${k}`, v.color]),
  ) as React.CSSProperties;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        role="img"
        aria-label={label}
        style={style}
        className={cn(
          "absolute inset-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted-foreground/10 [&_.recharts-surface]:outline-hidden",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-muted-foreground",
          className,
        )}
      >
        <RechartsPrimitive.ResponsiveContainer minWidth={0} minHeight={0}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipItem = { dataKey?: string | number; name?: string | number; value?: any; color?: string; payload?: any };

export function ChartTooltipContent({ active, payload, label, labelFormatter, formatter }: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: any;
  labelFormatter?: (label: any, payload: TooltipItem[]) => React.ReactNode;
  /** Replaces the default "name  value" row. */
  formatter?: (value: any, key: string, item: TooltipItem) => React.ReactNode;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;
  const heading = labelFormatter ? labelFormatter(label, payload) : label;

  return (
    <div className="grid min-w-36 items-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {heading != null && heading !== "" && <div className="font-medium">{heading}</div>}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name);
          if (formatter) return <div key={key}>{formatter(item.value, key, item)}</div>;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: item.color }} />
              <span className="text-muted-foreground">{config[key]?.label ?? item.name}</span>
              <span className="ml-auto font-medium tabular-nums">{String(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
