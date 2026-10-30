from datetime import time
from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    data_dir: Path = BACKEND_DIR / "data"
    # GB day-ahead gate closures: EPEX 09:20, N2EX 09:50. We use the earlier one so nothing
    # is used that a buyer couldn't have seen. All times are UTC (winter data, UK == UTC).
    default_cutoff: time = time(9, 20)
    # FUELHH publishTime equals the slot end for 668/672 slots (5-18 Jan 2026).
    actuals_lag_minutes: int = 0

    model_config = {"env_prefix": "GRID_"}


settings = Settings()
