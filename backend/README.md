# Wind forecast error API

FastAPI service that helps a buyer size a buffer for a day-ahead wind purchase. For a delivery slot it
returns the forecast a buyer would have had at decision time, plus how wrong the forecast has recently
been for that same slot. Data: Elexon WINDFOR (forecast) and FUELHH wind (actuals), Jan 2026.

## Decision-time logic

The decision for delivery day D is made on D-1 at a cutoff (default 09:20, the earlier of the GB
day-ahead gate closures: EPEX 09:20, N2EX 09:50). At that time T the buyer sees:

- **Forecasts** with `publishTime <= T`, taking the latest per slot.
- **Actuals** only for slots that have finished (`start + 30 min + lag <= T`).

Past days are scored against the forecast available at *their own* cutoff, never a later one. At a
09:20 cutoff the previous day's 12:00 slot has not finished, so the newest usable actual is D-2.
Error = forecast − actual, so positive means the forecast was too high.

## Read the bias with care

Over Jan 2026 (09:20 cutoff) the forecast reads **+1,746 MW high** against FUELHH actuals. That depends
on the actuals definition, so it is not a headline claim:

| Series | Mean, Jan 2026 |
| --- | --- |
| WINDFOR forecast | 13,031 MW |
| FUELHH wind (actuals used here) | 11,286 MW |
| AGWS wind (Elexon's other actuals series) | 14,039 MW |

Against AGWS the same forecast reads about 1,007 MW *low*. The bias is persistent, not a few bad days
(positive on 27 of 31 days, in every hour and wind-level quartile, and +1,436 MW even for forecasts
published 1-3 h before the slot), which fits a coverage mismatch more than a timing effect. Reproduce
with `python scripts/check_bias.py`. The error spread (MAE, P90) is more robust than the sign of the bias.

## Data notes

- WINDFOR forecasts are hourly, so only on-the-hour slots exist. FUELHH is half-hourly.
- FUELHH `publishTime` equals the slot end for 668/672 slots, so it carries no real lag information
  (`GRID_ACTUALS_LAG_MINUTES`, default 0). AGWS publishes a steady 58 minutes after each slot ends.
- All times are UTC, which equals UK time because the data is winter.
- Elexon caps date ranges at 7 days; `scripts/ingest.py` chunks requests to respect that.

## Endpoints

| Route | Purpose |
| --- | --- |
| `GET /health` | health check |
| `GET /v1/series?start&end&cutoff` | actual vs selected forecast per slot |
| `GET /v1/decision?delivery_date&slot&cutoff&days` | forecast for the slot plus its recent error history |
| `GET /v1/errors/summary?start&end&cutoff` | bias, MAE, RMSE, P90 |
| `GET /v1/errors/by-hour?start&end&cutoff` | error profile by hour of day |

`cutoff` is a time of day (`HH:MM`, UTC) on the day before delivery; default 09:20.

## Run

```
pip install -r requirements-dev.txt
python scripts/ingest.py        # downloads Dec 2025 - Feb 2026 into data/
python -m pytest
uvicorn app.main:app --port 8000
python scripts/export_openapi.py   # refresh openapi.json (the frontend generates its types from it)
```

## Layout

```
app/
  main.py, config.py, schemas.py, data_store.py
  services/   forecast_selection.py, errors.py   # pure pandas, no FastAPI imports
  routers/v1.py
scripts/      ingest.py, check_bias.py, export_openapi.py
tests/
```

## Configuration

Environment variables (see `.env.example`; locally a `.env` file is read, in production set them on the host):

| Variable | Default | Purpose |
| --- | --- | --- |
| `GRID_CORS_ORIGINS` | `*` | Comma-separated browser origins allowed to call the API. Set to the deployed frontend URL in production |
| `GRID_DEFAULT_CUTOFF` | `09:20` | Default decision time |
| `GRID_ACTUALS_LAG_MINUTES` | `0` | Lag added before an actual counts as visible |
| `GRID_DATA_DIR` | `./data` | Folder with `forecasts.csv` and `actuals.csv` |
| `PORT` | `8000` | Port the container listens on (Render sets it) |

## Deployment (Render, Docker)

The runtime reads `data/*.csv` only, so the image needs no pyarrow (the CSVs are committed; parquet is not shipped).
Dependencies are pinned in `requirements.txt`, and the container runs as a non-root user.

1. Push the repo, then in Render choose **New > Blueprint** and select it: `render.yaml` at the repo root
   creates the web service (Docker, root directory `backend`, health check `/health`).
   Or create a Web Service by hand: runtime Docker, root directory `backend`, health check path `/health`.
2. Set `GRID_CORS_ORIGINS` to your frontend's URL (no path), e.g. `https://your-app.vercel.app`.
3. Deploy, then check `https://<service>.onrender.com/health` and `/docs`.
4. Give the frontend that URL as `VITE_API_BASE` (see the frontend README).

On Render's free plan the service sleeps after inactivity, so the first request can take about a minute;
the frontend shows its loading skeleton and an error with Retry if that request times out.

Local container test:

```
docker build -t wind-api backend
docker run --rm -p 8000:8000 -e GRID_CORS_ORIGINS=http://localhost:5173 wind-api
```
