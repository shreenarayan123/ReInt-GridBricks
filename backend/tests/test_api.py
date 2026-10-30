from fastapi.testclient import TestClient

from app.data_store import DataStore, get_store
from app.main import app
from tests.test_forecast_selection import frames

fc, ac = frames()
app.dependency_overrides[get_store] = lambda: DataStore(fc, ac)
client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_decision_7pm_vs_morning():
    q = "/v1/decision?delivery_date=2026-01-14&slot=12:00&days=5"
    late = client.get(q + "&cutoff=19:00").json()
    early = client.get(q + "&cutoff=09:00").json()
    assert late["forecast_mw"] == 5600 and [h["error_mw"] for h in late["history"]] == [800, -500, 700, 800]
    assert early["forecast_mw"] == 5500 and [h["error_mw"] for h in early["history"]] == [800, -500, 700]
    assert late["history_summary"]["bias_mw"] == 450  # (800-500+700+800)/4


def test_decision_404_when_no_forecast():
    assert client.get("/v1/decision?delivery_date=2026-01-20&slot=12:00").status_code == 404


def test_series_and_summary_and_by_hour():
    r = client.get("/v1/series?start=2026-01-10&end=2026-01-13&cutoff=09:00").json()
    assert len(r["points"]) == 4 and r["points"][-1]["error_mw"] == 800
    s = client.get("/v1/errors/summary?start=2026-01-10&end=2026-01-13&cutoff=09:00").json()
    assert s["n"] == 4 and s["mae_mw"] == 700
    h = client.get("/v1/errors/by-hour?start=2026-01-10&end=2026-01-13").json()
    assert h["hours"][0]["hour"] == 12


def test_bad_range_is_422():
    assert client.get("/v1/series?start=2026-01-13&end=2026-01-10").status_code == 422
