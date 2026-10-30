import { PageHeader } from "../../components/AppShell";

export function NotesPage() {
  return (
    <>
      <PageHeader title="Data notes" subtitle="How decision time works, and what to keep in mind when reading the errors." />

      <section className="card">
        <h2>What a buyer can see at decision time</h2>
        <p>
          The decision for delivery day D is made on D−1 at the chosen decision time (default 09:20, the
          earlier of the GB day-ahead gate closures: EPEX 09:20, N2EX 09:50).
        </p>
        <ul>
          <li><strong>Forecasts:</strong> only those published before the decision time; the latest one is used.</li>
          <li><strong>Actuals:</strong> only for slots that have already finished.</li>
          <li><strong>Past days</strong> are scored against the forecast available at <em>their own</em> decision time, never a later one.</li>
        </ul>
        <p>
          So at a 09:20 decision the previous day's 12:00 slot has not happened yet, and the newest usable
          actual is from two days before delivery.
        </p>
        <p><strong>Error = forecast − actual.</strong> Positive means the forecast was too high.</p>
      </section>

      <section className="card">
        <h2>Why the bias depends on the actuals</h2>
        <p>
          Against FUELHH wind actuals the forecast reads about 1.7 GW high in January 2026. Against Elexon's
          AGWS series, which counts more wind, the same forecast reads about 1 GW low. Treat the sign of the
          bias with caution; the size of the errors (MAE, P90) is more robust.
        </p>
        <table>
          <thead><tr><th>Series (Jan 2026, hourly slots)</th><th>Mean</th><th>Forecast bias against it</th></tr></thead>
          <tbody>
            <tr><td>WINDFOR forecast, 09:20 decision</td><td>13,031 MW</td><td>–</td></tr>
            <tr><td>FUELHH wind (used in this tool)</td><td>11,286 MW</td><td>+1,746 MW</td></tr>
            <tr><td>AGWS wind</td><td>14,039 MW</td><td>−1,007 MW</td></tr>
          </tbody>
        </table>
        <p className="muted">
          The FUELHH bias is persistent, not a few bad days: positive on 27 of 31 days and in every hour,
          and still +1,436 MW for forecasts published 1–3 hours before the slot.
        </p>
      </section>

      <section className="card">
        <h2>Data</h2>
        <ul>
          <li>Forecasts are Elexon WINDFOR, published every 2–3 hours, hourly slots only, so slot choices are on the hour.</li>
          <li>Actuals are FUELHH (WIND), half-hourly. Its publish time equals the slot end, so no real lag is known; AGWS publishes about 58 minutes after the slot ends.</li>
          <li>Coverage: delivery days 2 Jan – 1 Feb 2026. Times are shown in UK time (equal to UTC in winter).</li>
        </ul>
      </section>
    </>
  );
}
