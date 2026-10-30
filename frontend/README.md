# Wind forecast error tool: frontend

React + TypeScript + Vite, TanStack Query, ECharts. Talks to the wind forecast error API (see the backend repo).

## Pages

- **Decision**: forecast for one delivery slot, a buffer sentence ("error stayed within X MW on 90% of days") and a daily error chart.
- **Overview**: Bias, MAE and P90 cards, a MAE comparison of two decision times (09:20 vs 19:00), and a zoomable actual-vs-forecast chart.
  The bias caveat (it depends on which actuals you use) is an info tooltip beside Bias.

Colours live in `src/theme.css` (teal UI accent; Google red = forecast too high, Google orange = too low; blue and green for the Overview series).

All controls live in the URL query string, so any view can be shared as a link. Cutoff changes are
debounced and previous data stays on screen while new data loads.

## Run locally

```
npm install
npm run dev     # /api is proxied to the backend at API_URL (default http://localhost:8000)
npm test
npm run build
```

Settings are environment variables; copy `.env.example` to `.env.local` to change them:

| Variable | When | Purpose |
| --- | --- | --- |
| `API_URL` | dev server | Where `/api` is proxied to (default `http://localhost:8000`) |
| `VITE_API_BASE` | **build time** | Public URL of the deployed API; default `/api`, which only works with the dev proxy |

## Deploy

This is a static single-page app (all state is in the query string, so no rewrite rules are needed).
On any static host (Vercel, Netlify, Cloudflare Pages, Render Static Site):

- Build command: `npm run build`, publish directory: `dist`, root directory: `frontend`.
- Set `VITE_API_BASE` to the API's public URL (for example `https://wind-forecast-api.onrender.com`)
  **before the build**; Vite bakes it into the bundle, so changing it needs a redeploy.
- Then set the API's `GRID_CORS_ORIGINS` to this site's URL (see the backend README), or the browser
  will block the requests.

## API types

Types in `src/api/schema.d.ts` are generated from the backend's OpenAPI schema so the two can't drift:

```
npm run gen:api -- http://localhost:8000/openapi.json
```

Versions are pinned exactly (`.npmrc`). TypeScript is pinned to 5.9.3 because `openapi-typescript` does not support 7.x yet.
