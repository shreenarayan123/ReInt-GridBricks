# Wind Forecast Error Tool

A small full-stack app that helps a buyer size a buffer for a day-ahead wind purchase. For one delivery
slot it shows the forecast the buyer would have had at decision time, and how wrong that forecast has
recently been for the same slot, so the buffer can be chosen from evidence.

Data: Elexon **WINDFOR** (wind forecast) against **FUELHH** wind (actual generation), GB, January 2026.


  ## Live Link : [REint GridBricks App](https://re-int-grid-bricks.vercel.app/).

> Built using [Claude Code](https://claude.com/claude-code).

## What it does

- **Decision**: the forecast for one delivery slot, a plain-language buffer ("Error stayed within X MW on
  90% of days", with the sample size) and a daily error bar chart for that slot.
- **Overview**: Bias, MAE and P90 cards for a date range, a comparison of two decision times
  (09:20 vs 19:00), and a zoomable actual-vs-forecast line chart.

Every control lives in the URL query string, so any view can be shared as a link.

## How the numbers are made

The decision for delivery day D is made on D-1 at a cutoff time (default 09:20, the EPEX day-ahead gate
closure). At that moment the buyer sees only:

- **Forecasts** published at or before the cutoff, taking the latest per slot.
- **Actuals** only for slots that had already finished.

Past days are scored against the forecast that was available at *their own* cutoff, never a later one.
**Error = forecast − actual**, so a positive error means the forecast was too high.

| Metric | Definition |
| --- | --- |
| Bias | mean of error |
| MAE | mean of absolute error |
| P90 | 90th percentile of absolute error |

Reference values for 2 Jan to 1 Feb at the 09:20 cutoff: bias +1,746 MW, MAE 2,022 MW, P90 4,154 MW,
n = 744 slots.

**Read the bias with care.** It depends on which actuals series you compare against (the same forecast
reads about 1 GW *low* against Elexon's AGWS series), so the size of the errors (MAE, P90) is more
trustworthy than the sign of the bias. Details are in [backend/README.md](backend/README.md).

## Tech stack

| Part | Stack |
| --- | --- |
| Backend | Python 3.12, FastAPI, pandas, pydantic-settings, uvicorn, pytest |
| Frontend | React 19, TypeScript, Vite, TanStack Query, shadcn/ui charts (Recharts), Tailwind utilities, Vitest |
| Deploy | Backend in Docker on Render (`render.yaml`), frontend as a static site |

Dependency versions are pinned exactly in both projects.

## Repository layout

```
backend/    FastAPI service, data (CSV), scripts, tests, Dockerfile
frontend/   React app (src/features, src/components, src/lib, src/api)
render.yaml Render Blueprint for the backend
```

## Run locally

Backend (http://localhost:8000, docs at `/docs`):

```
cd backend
pip install -r requirements-dev.txt
python -m pytest
uvicorn app.main:app --port 8000
```

Frontend (http://localhost:5173, `/api` is proxied to the backend):

```
cd frontend
npm install
npm run dev
npm test
```

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `GRID_CORS_ORIGINS` | backend | Browser origins allowed to call the API (set to the frontend URL in production) |
| `GRID_DEFAULT_CUTOFF` | backend | Default decision time (`09:20`) |
| `PORT` | backend | Port the container listens on (Render sets it) |
| `VITE_API_BASE` | frontend, build time | Public URL of the deployed API; default `/api` (dev proxy) |
| `API_URL` | frontend, dev only | Where the dev server proxies `/api` |

Copy `backend/.env.example` and `frontend/.env.example` to start. Full tables are in each README.

## Deploy

1. **Backend**: on Render choose New > Blueprint and select this repo (`render.yaml` creates a Docker web
   service with health check `/health`). Set `GRID_CORS_ORIGINS` to the frontend's URL.
2. **Frontend**: on any static host, root directory `frontend`, build `npm run build`, publish `dist`.
   Set `VITE_API_BASE` to the API's URL **before the build**.

On Render's free plan the API sleeps when idle, so the first request can take about a minute.
More detail: [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## API

| Route | Purpose |
| --- | --- |
| `GET /health` | health check |
| `GET /v1/series` | actual vs selected forecast per slot |
| `GET /v1/decision` | forecast for a slot plus its recent error history |
| `GET /v1/errors/summary` | bias, MAE, RMSE, P90 |
| `GET /v1/errors/by-hour` | error by hour of day (not used by the current UI) |

## Data

Elexon WINDFOR forecasts are hourly and FUELHH actuals are half-hourly. All times are UTC, which equals
UK time because the data is from winter. The committed CSVs in `backend/data/` are what the service reads;
`backend/scripts/ingest.py` re-downloads them from Elexon.
