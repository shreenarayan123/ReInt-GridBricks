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
    # Comma-separated browser origins allowed to call the API, e.g. "https://app.example.com".
    # "*" is fine for local work; set the real frontend origin(s) in production.
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_prefix": "GRID_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
