from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SeriesPoint(BaseModel):
    start_time: datetime
    forecast_mw: float
    forecast_publish_time: datetime
    decision_time: datetime
    actual_mw: Optional[float] = None
    error_mw: Optional[float] = None  # forecast - actual


class SeriesResponse(BaseModel):
    cutoff: str
    points: list[SeriesPoint]


class HistoryPoint(BaseModel):
    start_time: datetime
    forecast_mw: float
    actual_mw: float
    error_mw: float


class DecisionResponse(BaseModel):
    delivery_date: str
    slot: str
    cutoff: str
    decision_time: datetime
    forecast_mw: float
    forecast_publish_time: datetime
    history: list[HistoryPoint]
    history_summary: "Summary"


class Summary(BaseModel):
    n: int
    bias_mw: Optional[float] = None
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    p90_abs_mw: Optional[float] = None


class HourSummary(Summary):
    hour: int


class ByHourResponse(BaseModel):
    cutoff: str
    hours: list[HourSummary]


DecisionResponse.model_rebuild()
