from dataclasses import dataclass
from functools import lru_cache

import pandas as pd

from app.config import settings


@dataclass(frozen=True)
class DataStore:
    forecasts: pd.DataFrame  # start_time, publish_time, forecast_mw
    actuals: pd.DataFrame    # start_time, actual_mw


@lru_cache(maxsize=1)
def get_store() -> DataStore:
    """Load the CSV files once (written by scripts/ingest.py).

    CSV rather than parquet so the deployed bundle needs no pyarrow (~90 MB).
    """
    fc_path = settings.data_dir / "forecasts.csv"
    ac_path = settings.data_dir / "actuals.csv"
    if not (fc_path.exists() and ac_path.exists()):
        raise RuntimeError(f"Missing CSV files in {settings.data_dir}; run scripts/ingest.py")
    fc = pd.read_csv(fc_path, parse_dates=["start_time", "publish_time"], date_format="ISO8601")
    ac = pd.read_csv(ac_path, parse_dates=["start_time"], date_format="ISO8601")
    for df, cols in ((fc, ["start_time", "publish_time"]), (ac, ["start_time"])):
        for c in cols:
            df[c] = pd.to_datetime(df[c], utc=True)
    return DataStore(fc, ac)
