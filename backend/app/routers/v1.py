from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.data_store import DataStore, get_store
from app.schemas import (
    ByHourResponse, DecisionResponse, HistoryPoint, SeriesPoint, SeriesResponse, Summary,
)
from app.services import errors
from app.services.forecast_selection import build_series, decision_view

router = APIRouter(prefix="/v1")

MAX_RANGE_DAYS = 62

Cutoff = Query(settings.default_cutoff, description="Decision time of day (UTC) on the day before delivery, HH:MM")


def _check_range(start: date, end: date):
    if end < start:
        raise HTTPException(422, "end must be on or after start")
    if (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(422, f"range must be at most {MAX_RANGE_DAYS} days")


def _series(store: DataStore, start: date, end: date, cutoff: time):
    _check_range(start, end)
    return build_series(store.forecasts, store.actuals, start, end, cutoff)


@router.get("/series", response_model=SeriesResponse)
def series(start: date, end: date, cutoff: time = Cutoff, store: DataStore = Depends(get_store)):
    df = _series(store, start, end, cutoff)
    pts = [
        SeriesPoint(
            start_time=r.start_time, forecast_mw=r.forecast_mw,
            forecast_publish_time=r.publish_time, decision_time=r.decision_time,
            actual_mw=None if r.actual_mw != r.actual_mw else r.actual_mw,
            error_mw=None if r.error_mw != r.error_mw else r.error_mw,
        )
        for r in df.itertuples()
    ]
    return SeriesResponse(cutoff=cutoff.strftime("%H:%M"), points=pts)


@router.get("/decision", response_model=DecisionResponse)
def decision(delivery_date: date, slot: time, cutoff: time = Cutoff,
             days: int = Query(7, ge=1, le=30), store: DataStore = Depends(get_store)):
    f, hist, t = decision_view(store.forecasts, store.actuals, delivery_date, slot, cutoff, days,
                               settings.actuals_lag_minutes)
    if f is None:
        raise HTTPException(404, "no forecast published by the decision time for that slot")
    return DecisionResponse(
        delivery_date=delivery_date.isoformat(), slot=slot.strftime("%H:%M"),
        cutoff=cutoff.strftime("%H:%M"), decision_time=t,
        forecast_mw=f["forecast_mw"], forecast_publish_time=f["publish_time"],
        history=[HistoryPoint(start_time=r.start_time, forecast_mw=r.forecast_mw,
                              actual_mw=r.actual_mw, error_mw=r.error_mw)
                 for r in hist.itertuples()],
        history_summary=Summary(**errors.summarize(hist["error_mw"])),
    )


@router.get("/errors/summary", response_model=Summary)
def errors_summary(start: date, end: date, cutoff: time = Cutoff, store: DataStore = Depends(get_store)):
    return Summary(**errors.summarize(_series(store, start, end, cutoff)["error_mw"]))


@router.get("/errors/by-hour", response_model=ByHourResponse)
def errors_by_hour(start: date, end: date, cutoff: time = Cutoff, store: DataStore = Depends(get_store)):
    return ByHourResponse(cutoff=cutoff.strftime("%H:%M"),
                          hours=errors.by_hour(_series(store, start, end, cutoff)))
