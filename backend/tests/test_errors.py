import math

import pandas as pd

from app.services.errors import by_hour, summarize


def test_summarize_hand_made_rows():
    # errors: +800, -500, +700, -200 -> abs: 800, 500, 700, 200
    s = summarize(pd.Series([800, -500, 700, -200]))
    assert s["n"] == 4
    assert s["bias_mw"] == 200            # (800-500+700-200)/4
    assert s["mae_mw"] == 550             # (800+500+700+200)/4
    assert math.isclose(s["rmse_mw"], math.sqrt((640000 + 250000 + 490000 + 40000) / 4))
    assert math.isclose(s["p90_abs_mw"], 770)  # sorted 200,500,700,800: index 2.7 -> 700 + 0.7*100


def test_summarize_ignores_nan_and_handles_empty():
    assert summarize(pd.Series([100.0, float("nan")]))["n"] == 1
    assert summarize(pd.Series([], dtype=float))["bias_mw"] is None


def test_by_hour_groups_by_time_of_day():
    df = pd.DataFrame({
        "start_time": pd.to_datetime(["2026-01-10 06:00", "2026-01-11 06:00", "2026-01-10 12:00"], utc=True),
        "error_mw": [100, 300, -50],
    })
    out = {r["hour"]: r for r in by_hour(df)}
    assert out[6]["n"] == 2 and out[6]["bias_mw"] == 200
    assert out[12]["bias_mw"] == -50
