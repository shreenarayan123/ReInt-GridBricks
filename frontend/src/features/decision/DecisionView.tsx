import { useMemo } from "react";
import { useDecision, type Decision } from "../../api/client";
import { Boundary, Skeleton } from "../../components/Boundary";
import { Chart, type ChartOption } from "../../components/Chart";
import { CutoffInput } from "../../components/CutoffInput";
import { InfoTip } from "../../components/InfoTip";
import { Page } from "../../components/Page";
import { SlotPicker } from "../../components/SlotPicker";
import { fmtMw, fmtSignedMw, fmtUkDate, fmtUkDateTime, fmtUkShort } from "../../lib/format";
import { bufferSentence, SMALL_SAMPLE } from "../../lib/insights";
import { errorSide, SIDE_LABEL } from "../../lib/sign";
import { previousDayVisible } from "../../lib/stats";
import { chartColors } from "../../lib/theme";
import type { UrlState } from "../../lib/urlState";

type Props = { state: UrlState; update: (p: Partial<UrlState>) => void };

export function DecisionView({ state, update }: Props) {
  const query = useDecision(state);

  const filters = (
    <>
      <label className="field">
        <span>Delivery date</span>
        <input type="date" value={state.date} onChange={(e) => e.target.value && update({ date: e.target.value })} />
      </label>
      <SlotPicker value={state.slot} onChange={(slot) => update({ slot })} />
      <CutoffInput label="Decision time (day before)" value={state.cutoff} onChange={(cutoff) => update({ cutoff })} />
      <label className="field">
        <span>History days</span>
        <input type="number" min={1} max={30} value={state.days}
          onChange={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= 30) update({ days: n }); }} />
      </label>
    </>
  );

  return (
    <Page filters={filters}>
      <Boundary query={query} fill skeleton={<DecisionSkeleton />} className="state-page">
        {(d) => <Result d={d} state={state} />}
      </Boundary>
    </Page>
  );
}

function DecisionSkeleton() {
  return (
    <>
      <div className="grid-2">
        <div className="card"><Skeleton className="sk-line" /><Skeleton className="sk-big" /><Skeleton className="sk-line" /></div>
        <div className="card"><Skeleton className="sk-line" /><Skeleton className="sk-big" /><Skeleton className="sk-line" /></div>
      </div>
      <div className="card card-fill"><Skeleton className="sk-line" /><Skeleton className="sk-chart" /></div>
    </>
  );
}

function Result({ d, state }: { d: Decision; state: UrlState }) {
  const n = d.history_summary.n;
  const hidden = !previousDayVisible(state.cutoff, state.slot);
  const option = useMemo(() => historyOption(d), [d]);
  const sentence = bufferSentence(d.history_summary.p90_abs_mw);

  return (
    <>
      <div className="grid-2">
        <section className="card" aria-label="Forecast">
          <div className="card-h"><h2>Forecast · {fmtUkDate(d.delivery_date)}, {d.slot}</h2></div>
          <div className="big">{fmtMw(d.forecast_mw)}</div>
          <p className="muted">Published {fmtUkDateTime(d.forecast_publish_time)}, the latest before the {fmtUkDateTime(d.decision_time)} decision.</p>
        </section>

        <section className="card" aria-label="Buffer">
          <div className="card-h">
            <h2>Buffer</h2>
            {n > 0 && (
              <span className="badge" title={n < SMALL_SAMPLE ? "Small sample: treat the figure as indicative." : undefined}>
                n = {n} {n === 1 ? "day" : "days"}
              </span>
            )}
          </div>
          {n === 0 || !sentence ? (
            <p className="muted">No finished days to learn from at this decision time.</p>
          ) : (
            <p className="buffer-sentence">{sentence}.</p>
          )}
        </section>
      </div>

      <section className="card card-fill" aria-label="Daily error">
        <div className="card-h">
          <h2>
            Daily error · {d.slot} slot
            {hidden && (
              <InfoTip label="About the latest actual">
                Previous day is not visible at a {state.cutoff} cutoff: the {state.slot} slot has not finished
                yet, so the latest actual available is two days before delivery.
              </InfoTip>
            )}
          </h2>
          <span className="legend">
            <i className="dot dot-over" /> forecast too high <i className="dot dot-under" /> too low
          </span>
        </div>
        {n === 0 ? (
          <div className="state">No history to show.</div>
        ) : (
          <div className="chart-box">
            <Chart option={option} label="Forecast error by day for the selected slot" />
          </div>
        )}
      </section>
    </>
  );
}

function historyOption(d: Decision): ChartOption {
  const c = chartColors();
  const sideColor = (mw: number) => (errorSide(mw) === "low" ? c.under : c.over);
  return {
    grid: { left: 56, right: 12, top: 12, bottom: 24 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const first = Array.isArray(params) ? params[0] : params;
        const h = d.history[(first as { dataIndex: number }).dataIndex];
        const side = errorSide(h.error_mw);
        return `<b>${fmtUkDate(h.start_time)}</b><br/>Forecast: ${fmtMw(h.forecast_mw)}<br/>Actual: ${fmtMw(h.actual_mw)}`
          + `<br/>Error: <b>${fmtSignedMw(h.error_mw)}</b>${side === "flat" ? "" : ` (${SIDE_LABEL[side]})`}`;
      },
    },
    xAxis: { type: "category", data: d.history.map((h) => fmtUkShort(h.start_time)), axisLabel: { color: c.text }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { color: c.text, formatter: (v: number) => v.toLocaleString("en-GB") }, splitLine: { lineStyle: { color: c.grid } } },
    series: [{
      type: "bar",
      barMaxWidth: 36,
      data: d.history.map((h) => ({ value: Math.round(h.error_mw), itemStyle: { color: sideColor(h.error_mw) } })),
      markLine: { silent: true, symbol: "none", data: [{ yAxis: 0 }], label: { show: false }, lineStyle: { color: c.neutral } },
    }],
  };
}
