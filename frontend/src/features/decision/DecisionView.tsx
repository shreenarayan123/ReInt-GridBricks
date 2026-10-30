import { useMemo } from "react";
import { useDecision, type Decision } from "../../api/client";
import { Chart, type ChartOption } from "../../components/Chart";
import { CutoffInput } from "../../components/CutoffInput";
import { ErrorBadge } from "../../components/ErrorBadge";
import { KpiCard } from "../../components/KpiCard";
import { Panel } from "../../components/Panel";
import { SlotPicker } from "../../components/SlotPicker";
import { fmtMw, fmtSignedMw, fmtUkDate, fmtUkDateTime } from "../../lib/format";
import { previousDayVisible } from "../../lib/stats";
import type { UrlState } from "../../lib/urlState";

const SMALL_SAMPLE = 10;

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void };

export function DecisionView({ state, update }: Props) {
  const query = useDecision(state);

  return (
    <section aria-label="Decision view">
      <div className="toolbar">
        <label className="field">
          <span>Delivery date</span>
          <input type="date" value={state.date} onChange={(e) => e.target.value && update({ date: e.target.value })} />
        </label>
        <SlotPicker value={state.slot} onChange={(slot) => update({ slot })} />
        <CutoffInput label="Decision time (UK, day before)" value={state.cutoff} onChange={(cutoff) => update({ cutoff })} />
        <label className="field">
          <span>History days</span>
          <input type="number" min={1} max={30} value={state.days}
            onChange={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= 30) update({ days: n }); }} />
        </label>
      </div>

      <Panel query={query}>{(d) => <Result d={d} state={state} />}</Panel>
    </section>
  );
}

function Result({ d, state }: { d: Decision; state: UrlState }) {
  const n = d.history_summary.n;
  const hidden = !previousDayVisible(state.cutoff, state.slot);
  const option = useMemo(() => historyOption(d), [d]);

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <h2>Forecast for {fmtUkDate(d.delivery_date)}, {d.slot}</h2>
          <div className="big">{fmtMw(d.forecast_mw)}</div>
          <p className="muted">
            Latest forecast published before the decision at {fmtUkDateTime(d.decision_time)}:
            published {fmtUkDateTime(d.forecast_publish_time)}.
          </p>
        </div>

        <div className="card">
          <h2>Buffer suggestion</h2>
          {n === 0 ? (
            <p>No finished days to learn from at this decision time.</p>
          ) : (
            <>
              <p className="big-sm">
                Over this window, the error stayed within {fmtMw(d.history_summary.p90_abs_mw)} on 90% of days.
              </p>
              <p className="muted">
                Sample size: {n} {n === 1 ? "day" : "days"}.
                {n < SMALL_SAMPLE && " This is a small sample, so treat the figure as indicative."}
              </p>
            </>
          )}
        </div>
      </div>

      {hidden && (
        <div className="note" role="note">
          Previous day is not visible at a {state.cutoff} cutoff: the {state.slot} slot has not finished
          yet, so the latest actual available is two days before delivery.
        </div>
      )}

      <div className="card">
        <h2>Error history for the {d.slot} slot</h2>
        <p className="muted">
          Error = forecast − actual. <strong>Positive means the forecast was too high</strong>, so you
          would have bought too little. Each day's forecast is the one available at its own decision time.
        </p>
        {n === 0 ? <p>No history to show.</p> : (
          <>
            <Chart option={option} height={220} label="Forecast error by day for the selected slot" />
            <table>
              <thead><tr><th>Day</th><th>Forecast</th><th>Actual</th><th>Error</th></tr></thead>
              <tbody>
                {[...d.history].reverse().map((h) => (
                  <tr key={h.start_time}>
                    <td>{fmtUkDate(h.start_time)}</td>
                    <td>{fmtMw(h.forecast_mw)}</td>
                    <td>{fmtMw(h.actual_mw)}</td>
                    <td><ErrorBadge mw={h.error_mw} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="kpis">
              <KpiCard label="Bias" value={fmtSignedMw(d.history_summary.bias_mw)} hint="mean error" />
              <KpiCard label="MAE" value={fmtMw(d.history_summary.mae_mw)} />
              <KpiCard label="RMSE" value={fmtMw(d.history_summary.rmse_mw)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function historyOption(d: Decision): ChartOption {
  return {
    grid: { left: 60, right: 16, top: 16, bottom: 28 },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtSignedMw(v) },
    xAxis: { type: "category", data: d.history.map((h) => fmtUkDate(h.start_time)) },
    yAxis: { type: "value", name: "MW", nameGap: 8 },
    series: [{
      type: "bar",
      data: d.history.map((h) => ({
        value: Math.round(h.error_mw),
        itemStyle: { color: h.error_mw > 0 ? "#b45309" : "#1d4ed8" },
      })),
      markLine: { silent: true, symbol: "none", data: [{ yAxis: 0 }], lineStyle: { color: "#64748b" } },
    }],
  };
}
