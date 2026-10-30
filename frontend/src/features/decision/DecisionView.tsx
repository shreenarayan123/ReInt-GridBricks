import { useDecision, type Decision } from "../../api/client";
import { Boundary, Skeleton } from "../../components/Boundary";
import { CutoffInput } from "../../components/CutoffInput";
import { InfoTip } from "../../components/InfoTip";
import { Page } from "../../components/Page";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../../components/ui/chart";
import { SlotPicker } from "../../components/SlotPicker";
import { fmtMw, fmtSignedMw, fmtUkDate, fmtUkDateTime, fmtUkShort } from "../../lib/format";
import { bufferSentence, SMALL_SAMPLE } from "../../lib/insights";
import { errorSide, SIDE_LABEL } from "../../lib/sign";
import { previousDayVisible } from "../../lib/stats";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
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
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-[var(--over)]" />forecast too high</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-[var(--under)]" />too low</span>
          </span>
        </div>
        {n === 0 ? (
          <div className="state">No history to show.</div>
        ) : (
          <div className="chart-box">
            <HistoryChart d={d} />
          </div>
        )}
      </section>
    </>
  );
}

const historyConfig = { error: { label: "Error" } } satisfies ChartConfig;
const sideColor = (mw: number) => (errorSide(mw) === "low" ? "var(--under)" : "var(--over)");

/** shadcn bar chart: one bar per day, red when the forecast was too high, orange when too low. */
function HistoryChart({ d }: { d: Decision }) {
  const data = d.history.map((h) => ({ ...h, label: fmtUkShort(h.start_time), error: Math.round(h.error_mw) }));
  return (
    <ChartContainer config={historyConfig} label="Forecast error by day for the selected slot">
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={8} />
        <YAxis width={56} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toLocaleString("en-GB")} />
        <ReferenceLine y={0} />
        <ChartTooltip cursor content={
          <ChartTooltipContent
            labelFormatter={(_: unknown, items) => fmtUkDate(items[0].payload.start_time)}
            formatter={(_v, _k, item) => {
              const h = item.payload as Decision["history"][number];
              const side = errorSide(h.error_mw);
              return (
                <div className="grid gap-0.5">
                  <div>Forecast: {fmtMw(h.forecast_mw)}</div>
                  <div>Actual: {fmtMw(h.actual_mw)}</div>
                  <div>Error: <b>{fmtSignedMw(h.error_mw)}</b>{side === "flat" ? "" : ` (${SIDE_LABEL[side]})`}</div>
                </div>
              );
            }} />
        } />
        <Bar dataKey="error" maxBarSize={36} isAnimationActive={false}>
          {data.map((h) => <Cell key={h.start_time} fill={sideColor(h.error_mw)} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
