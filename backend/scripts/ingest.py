"""Download Elexon wind forecasts (WINDFOR) and actuals (FUELHH, WIND) into parquet.

Decisions made in Jan 2026 are for delivery days 2 Jan - 1 Feb, so we pull from mid-December
(error history for the earliest decisions) to 2 Feb.

Usage: python scripts/ingest.py [FROM_DATE TO_DATE]
"""
import json
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
MAX_DAYS = 7  # API limit on range, inclusive


def get(dataset, **params):
    params["format"] = "json"
    with urlopen(f"{BASE}/{dataset}?{urlencode(params)}", timeout=120) as r:
        return json.load(r)["data"]


def windows(first: date, last: date, days: int = MAX_DAYS - 1):
    """(start, end) inclusive date windows that respect the API's 7-day cap."""
    d = first
    while d <= last:
        yield d, min(d + timedelta(days=days - 1), last)
        d += timedelta(days=days)


def ingest_forecasts(first: date, last: date) -> pd.DataFrame:
    rows = []
    for a, b in windows(first, last):
        rows += get("WINDFOR", publishDateTimeFrom=f"{a}T00:00Z",
                    publishDateTimeTo=f"{b + timedelta(days=1)}T00:00Z")
        print(f"  WINDFOR {a}..{b}: {len(rows)} rows so far")
    df = pd.DataFrame(rows)[["startTime", "publishTime", "generation"]]
    df = df.rename(columns={"startTime": "start_time", "publishTime": "publish_time",
                            "generation": "forecast_mw"})
    for c in ("start_time", "publish_time"):
        df[c] = pd.to_datetime(df[c], utc=True)
    return (df.drop_duplicates(["start_time", "publish_time"])
              .sort_values(["start_time", "publish_time"]).reset_index(drop=True))


def ingest_actuals(first: date, last: date) -> pd.DataFrame:
    rows = []
    for a, b in windows(first, last):
        rows += get("FUELHH", settlementDateFrom=a.isoformat(),
                    settlementDateTo=b.isoformat(), fuelType="WIND")
        print(f"  FUELHH {a}..{b}: {len(rows)} rows so far")
    df = pd.DataFrame(rows)[["startTime", "generation"]]
    df = df.rename(columns={"startTime": "start_time", "generation": "actual_mw"})
    df["start_time"] = pd.to_datetime(df["start_time"], utc=True)
    return (df.drop_duplicates("start_time").sort_values("start_time")
              .reset_index(drop=True))


def main():
    first = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 2 else date(2025, 12, 15)
    last = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else date(2026, 2, 2)
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    fc = ingest_forecasts(first, last)
    ac = ingest_actuals(first, last)
    # Parquet for analysis; CSV is what the deployed API reads (keeps pyarrow out of the bundle).
    fc.to_parquet(settings.data_dir / "forecasts.parquet")
    ac.to_parquet(settings.data_dir / "actuals.parquet")
    fc.to_csv(settings.data_dir / "forecasts.csv", index=False)
    ac.to_csv(settings.data_dir / "actuals.csv", index=False)
    print(f"forecasts: {len(fc)} rows, {fc.start_time.min()} .. {fc.start_time.max()}")
    print(f"actuals:   {len(ac)} rows, {ac.start_time.min()} .. {ac.start_time.max()}")


if __name__ == "__main__":
    main()
