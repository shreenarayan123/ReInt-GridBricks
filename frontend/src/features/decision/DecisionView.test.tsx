import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CutoffInput } from "../../components/CutoffInput";
import { DEFAULTS } from "../../lib/urlState";
import { DecisionView } from "./DecisionView";

vi.mock("../../components/Chart", () => ({ Chart: () => <div data-testid="chart" /> }));

// Real figures for delivery 14 Jan 12:00, decided 13 Jan 09:20.
const DECISION = {
  delivery_date: "2026-01-14", slot: "12:00", cutoff: "09:20",
  decision_time: "2026-01-13T09:20:00Z", forecast_mw: 6821, forecast_publish_time: "2026-01-13T07:30:00Z",
  history: [
    { start_time: "2026-01-09T12:00:00Z", forecast_mw: 5000, actual_mw: 5059, error_mw: -59 },
    { start_time: "2026-01-10T12:00:00Z", forecast_mw: 6000, actual_mw: 5832, error_mw: 168 },
    { start_time: "2026-01-11T12:00:00Z", forecast_mw: 19491, actual_mw: 15400, error_mw: 4091 },
    { start_time: "2026-01-12T12:00:00Z", forecast_mw: 19882, actual_mw: 14529, error_mw: 5353 },
  ],
  history_summary: { n: 4, bias_mw: 2388, mae_mw: 2418, rmse_mw: 3370, p90_abs_mw: 4974 },
};

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DecisionView state={DEFAULTS} update={() => {}} />
    </QueryClientProvider>,
  );
}

const mockFetch = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: status < 400, status, statusText: "x", json: async () => body,
  }));

afterEach(() => vi.unstubAllGlobals());

describe("DecisionView", () => {
  it("shows the forecast, buffer sentence with sample size, and the not-visible tooltip", async () => {
    mockFetch(200, DECISION);
    renderView();
    expect(await screen.findByText("6,821 MW")).toBeInTheDocument();
    expect(screen.getByText("Error stayed within 4,974 MW on 90% of days.")).toBeInTheDocument();
    expect(screen.getByText("n = 4 days")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Previous day is not visible at a 09:20 cutoff");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/RMSE/)).not.toBeInTheDocument();
  });

  it("offers a retry when the request fails", { timeout: 10000 }, async () => {
    mockFetch(500, { detail: "boom" });
    renderView();
    expect(await screen.findByRole("alert", {}, { timeout: 5000 })).toHaveTextContent("boom");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows a message when no forecast exists for the slot", async () => {
    mockFetch(404, { detail: "no forecast published by the decision time for that slot" });
    renderView();
    expect(await screen.findByText(/no forecast published/)).toBeInTheDocument();
  });
});

describe("CutoffInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("commits once, after the user pauses, and ignores invalid times", () => {
    const onChange = vi.fn();
    render(<CutoffInput label="Cutoff" value="09:20" onChange={onChange} delayMs={400} />);
    const input = screen.getByLabelText("Cutoff");
    fireEvent.change(input, { target: { value: "10:00" } });
    fireEvent.change(input, { target: { value: "10:15" } });
    act(() => { vi.advanceTimersByTime(399); });
    expect(onChange).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("10:15");
  });
});
