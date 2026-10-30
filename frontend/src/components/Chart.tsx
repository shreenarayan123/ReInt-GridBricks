import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([
  BarChart, LineChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent,
  MarkLineComponent, CanvasRenderer,
]);

export type ChartOption = echarts.EChartsCoreOption;

/** Thin ECharts wrapper: one instance per mount, option updates in place, fills and follows its parent. */
export function Chart({ option, label }: { option: ChartOption; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const c = echarts.init(el.current!);
    chart.current = c;
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current!);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={el} role="img" aria-label={label} className="chart" />;
}
