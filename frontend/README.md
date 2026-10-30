# Wind forecast error tool: frontend

React + TypeScript + Vite, TanStack Query, ECharts. Talks to the wind forecast error API (see the backend repo).

## Pages

- **Decision**: forecast for one delivery slot, a buffer sentence ("error stayed within X MW on 90% of days") and a daily error chart.
- **Overview**: Bias, MAE and P90 cards, a MAE comparison of two decision times (09:20 vs 19:00), and a zoomable actual-vs-forecast chart.
- **Error by hour**: bias and MAE by hour of day, with a one-line takeaway computed from the data.
  The bias caveat (it depends on which actuals you use) is an info tooltip beside Bias.

Colours live in `src/theme.css` (one teal accent; orange = forecast too high, blue = too low).

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
