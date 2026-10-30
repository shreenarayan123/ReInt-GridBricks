# Wind forecast error tool: frontend

React + TypeScript + Vite, TanStack Query, ECharts. Talks to the wind forecast error API (see the backend repo).

## Pages

- **Decision**: forecast for one delivery slot, recent error history, and a buffer suggestion.
- **Overview**: bias / MAE / RMSE / P90 and a zoomable actual-vs-forecast chart.
- **Error profile**: error by hour of day and the error distribution.
- **Cutoff comparison**: two decision times side by side (e.g. 09:20 vs 19:00).
- **Data notes**: how decision time works and why the sign of the bias depends on the actuals used.

All controls live in the URL query string, so any view can be shared as a link. Cutoff changes are
debounced and previous data stays on screen while new data loads.

## Run

```
npm install
API_URL=http://localhost:8000 npm run dev   # /api is proxied to the backend (PowerShell: $env:API_URL="...")
npm test
npm run build
```

For a deployed build, set `VITE_API_BASE` to the API's base URL (default `/api`, which only works with the dev proxy).

## API types

Types in `src/api/schema.d.ts` are generated from the backend's OpenAPI schema so the two can't drift:

```
npm run gen:api -- http://localhost:8000/openapi.json
```

Versions are pinned exactly (`.npmrc`). TypeScript is pinned to 5.9.3 because `openapi-typescript` does not support 7.x yet.
