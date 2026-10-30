from datetime import date, time

import pandas as pd

from app.services.forecast_selection import (
    build_series, decision_view, select_forecasts, visible_actuals,
)

# Illustrative figures from the design note (not real Elexon data); 12:00 slot each day.
DATA = {10: (6200, 5400), 11: (4100, 4600), 12: (5000, 4300), 13: (5300, 4500)}


def ts(day, h=0, m=0):
    return pd.Timestamp(2026, 1, day, h, m, tz="UTC")


def frames():
    fc, ac = [], []
    for day, (f, a) in DATA.items():
        # Each day's forecast is published 08:00 the day before: inside both cutoffs.
        fc.append((ts(day, 12), ts(day - 1, 8), f))
        ac.append((ts(day, 12), a))
    # The 12th also gets a hindsight forecast, published on the morning of the 13th.
    fc.append((ts(12, 12), ts(13, 8), 4350))
    # The slot being bought (14th): one forecast in the morning, a revised one at noon.
    fc.append((ts(14, 12), ts(13, 8), 5500))
    fc.append((ts(14, 12), ts(13, 12), 5600))
    forecasts = pd.DataFrame(fc, columns=["start_time", "publish_time", "forecast_mw"])
    actuals = pd.DataFrame(ac, columns=["start_time", "actual_mw"])
    return forecasts, actuals


def test_7pm_decision_sees_13th_and_revised_forecast():
    fc, ac = frames()
    f, hist, t = decision_view(fc, ac, date(2026, 1, 14), time(12, 0), time(19, 0), days=5)
    assert t == ts(13, 19)
    assert f["forecast_mw"] == 5600
    assert list(hist["error_mw"]) == [800, -500, 700, 800]  # 10th..13th


def test_morning_decision_stops_at_12th_and_uses_morning_forecast():
    fc, ac = frames()
    f, hist, t = decision_view(fc, ac, date(2026, 1, 14), time(12, 0), time(9, 0), days=5)
    assert t == ts(13, 9)
    assert f["forecast_mw"] == 5500
    assert list(hist["error_mw"]) == [800, -500, 700]  # 13th actual not finished yet


def test_past_slot_never_scored_against_hindsight_forecast():
    fc, _ = frames()
    sel = select_forecasts(fc, time(9, 0)).set_index("start_time")
    assert sel.loc[ts(12, 12), "forecast_mw"] == 5000  # not the 4350 published on the 13th


def test_days_limits_history():
    fc, ac = frames()
    _, hist, _ = decision_view(fc, ac, date(2026, 1, 14), time(12, 0), time(19, 0), days=2)
    assert list(hist["error_mw"]) == [700, 800]  # 12th, 13th


def test_actual_visible_only_after_slot_end_plus_lag():
    ac = pd.DataFrame({"start_time": [ts(13, 12)], "actual_mw": [4500]})
    end = ts(13, 12, 30)
    assert visible_actuals(ac, end - pd.Timedelta(minutes=1)).empty
    assert len(visible_actuals(ac, end)) == 1
    assert visible_actuals(ac, end + pd.Timedelta(minutes=4), lag_minutes=5).empty
    assert len(visible_actuals(ac, end + pd.Timedelta(minutes=5), lag_minutes=5)) == 1


def test_no_forecast_for_slot_returns_none():
    fc, ac = frames()
    f, hist, _ = decision_view(fc, ac, date(2026, 1, 20), time(12, 0), time(9, 0), days=3)
    assert f is None and hist.empty


def test_build_series_computes_error_and_keeps_actual():
    fc, ac = frames()
    s = build_series(fc, ac, date(2026, 1, 10), date(2026, 1, 13), time(9, 0))
    row = s.set_index("start_time").loc[ts(13, 12)]
    assert row["forecast_mw"] == 5300 and row["actual_mw"] == 4500 and row["error_mw"] == 800
