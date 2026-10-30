"""What a buyer can see at decision time T. No FastAPI imports: pure pandas.

The decision for a delivery slot is made on the day before delivery at `cutoff`
(a time of day, UTC). Two rules:
  1. Forecast: latest forecast with publish_time <= T.
  2. Actual:   visible once start_time + 30 min + lag <= T.
"""
from datetime import date, time

import pandas as pd

SLOT = pd.Timedelta(minutes=30)
DAY = pd.Timedelta(days=1)


def _offset(cutoff: time) -> pd.Timedelta:
    return pd.Timedelta(hours=cutoff.hour, minutes=cutoff.minute)


def decision_time(slot_start: pd.Timestamp, cutoff: time) -> pd.Timestamp:
    """T for a delivery slot: `cutoff` on the day before the slot's delivery day."""
    return slot_start.normalize() - DAY + _offset(cutoff)


def select_forecasts(forecasts: pd.DataFrame, cutoff: time) -> pd.DataFrame:
    """Per slot, the latest forecast with publish_time <= that slot's own decision time.

    Each slot is judged against its own T, so past slots are never scored against a
    forecast published after the slot's decision (the "own cutoff" rule).
    Returns columns: start_time, publish_time, forecast_mw, decision_time.
    """
    df = forecasts.copy()
    df["decision_time"] = df["start_time"].dt.normalize() - DAY + _offset(cutoff)
    df = df[df["publish_time"] <= df["decision_time"]]
    if df.empty:
        return df
    idx = df.groupby("start_time")["publish_time"].idxmax()
    return df.loc[idx].sort_values("start_time").reset_index(drop=True)


def visible_actuals(actuals: pd.DataFrame, t: pd.Timestamp, lag_minutes: int = 0) -> pd.DataFrame:
    """Actuals for slots already finished (plus lag) at t."""
    done = actuals["start_time"] + SLOT + pd.Timedelta(minutes=lag_minutes) <= t
    return actuals[done]


def build_series(forecasts: pd.DataFrame, actuals: pd.DataFrame,
                 start: date, end: date, cutoff: time) -> pd.DataFrame:
    """Selected forecast vs actual for every slot on delivery days start..end (inclusive).

    This is an evaluation view: actuals are shown regardless of T. Columns:
    start_time, forecast_mw, publish_time, decision_time, actual_mw, error_mw (forecast - actual).
    """
    lo = pd.Timestamp(start, tz="UTC")
    hi = pd.Timestamp(end, tz="UTC") + DAY
    sel = select_forecasts(forecasts[(forecasts["start_time"] >= lo) & (forecasts["start_time"] < hi)],
                           cutoff)
    out = sel.merge(actuals, on="start_time", how="left")
    out["error_mw"] = out["forecast_mw"] - out["actual_mw"]
    return out


def decision_view(forecasts: pd.DataFrame, actuals: pd.DataFrame, delivery_date: date,
                  slot: time, cutoff: time, days: int, lag_minutes: int = 0):
    """Forecast for one slot plus its recent error history, as known at its decision time.

    Returns (forecast_row | None, history DataFrame, T). History covers the `days` delivery
    days before delivery_date for the same time of day, keeping only days whose actual is
    visible at T (so with a morning cutoff the latest day available is D-2).
    """
    slot_start = pd.Timestamp(delivery_date, tz="UTC") + _offset(slot)
    t = decision_time(slot_start, cutoff)

    wanted = [slot_start - k * DAY for k in range(0, days + 1)]
    sel = select_forecasts(forecasts[forecasts["start_time"].isin(wanted)], cutoff)

    target = sel[sel["start_time"] == slot_start]
    forecast = target.iloc[0] if len(target) else None

    hist = sel[sel["start_time"] < slot_start].merge(
        visible_actuals(actuals, t, lag_minutes), on="start_time", how="inner")
    hist["error_mw"] = hist["forecast_mw"] - hist["actual_mw"]
    return forecast, hist.sort_values("start_time").reset_index(drop=True), t
