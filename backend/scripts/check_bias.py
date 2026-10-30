"""Is the forecast bias real, or a definition mismatch between datasets?

Compares the WINDFOR forecast (09:20 cutoff) against two actuals series for Jan 2026:
FUELHH (WIND) and AGWS (all wind, onshore + offshore). Also reports the real AGWS publish lag.
Usage: python scripts/check_bias.py   (needs data/ from ingest.py and network access)
"""
import json
import sys
from datetime import date, time, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.data_store import get_store  # noqa: E402
from app.services.forecast_selection import build_series  # noqa: E402

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def get(dataset, **params):
    params["format"] = "json"
    with urlopen(f"{BASE}/{dataset}?{urlencode(params)}", timeout=120) as r:
        return json.load(r)["data"]


def load_agws(first: date, last: date) -> pd.DataFrame:
    rows, d = [], first
    while d <= last:
        e = min(d + timedelta(days=5), last)
        rows += get("AGWS", publishDateTimeFrom=f"{d}T00:00Z",
                    publishDateTimeTo=f"{e + timedelta(days=1)}T00:00Z")
        d = e + timedelta(days=1)
    a = pd.DataFrame(rows)
    for c in ("startTime", "publishTime"):
        a[c] = pd.to_datetime(a[c], utc=True)
    # keep the latest revision per slot and fuel type
    return (a.sort_values(["startTime", "psrType", "documentRevisionNumber"])
             .drop_duplicates(["startTime", "psrType"], keep="last"))


def main():
    store = get_store()
    agws = load_agws(date(2026, 1, 1), date(2026, 2, 3))
    total = agws.pivot(index="startTime", columns="psrType", values="quantity").sum(axis=1)

    ser = build_series(store.forecasts, store.actuals, date(2026, 1, 2), date(2026, 2, 1),
                       time(9, 20)).set_index("start_time")
    x = ser.join(total.rename("agws"), how="inner").dropna()
    print(f"n={len(x)} hourly slots, Jan 2026, 09:20 cutoff")
    print(f"mean forecast {x.forecast_mw.mean():.0f} MW | FUELHH {x.actual_mw.mean():.0f} | AGWS {x.agws.mean():.0f}")
    print(f"bias vs FUELHH {(x.forecast_mw - x.actual_mw).mean():+.0f} MW | "
          f"vs AGWS {(x.forecast_mw - x.agws).mean():+.0f} MW")
    lag = (agws.publishTime - (agws.startTime + pd.Timedelta(minutes=30))).dt.total_seconds() / 60
    print(f"AGWS publish lag after slot end (min): median {lag.median():.0f}, "
          f"p10 {lag.quantile(.1):.0f}, p90 {lag.quantile(.9):.0f}")


if __name__ == "__main__":
    main()
