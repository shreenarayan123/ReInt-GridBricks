"""Forecast error metrics. Error = forecast - actual, so positive means over-forecast."""
import numpy as np
import pandas as pd


def summarize(error_mw: pd.Series) -> dict:
    e = error_mw.dropna()
    if e.empty:
        return {"n": 0, "bias_mw": None, "mae_mw": None, "rmse_mw": None, "p90_abs_mw": None}
    abs_e = e.abs()
    return {
        "n": int(len(e)),
        "bias_mw": float(e.mean()),
        "mae_mw": float(abs_e.mean()),
        "rmse_mw": float(np.sqrt((e ** 2).mean())),
        "p90_abs_mw": float(abs_e.quantile(0.9)),
    }


def by_hour(series: pd.DataFrame) -> list[dict]:
    """Error profile by time of day (UTC hour) from a build_series() frame."""
    df = series.dropna(subset=["error_mw"])
    out = []
    for hour, g in df.groupby(df["start_time"].dt.hour):
        out.append({"hour": int(hour), **summarize(g["error_mw"])})
    return out
