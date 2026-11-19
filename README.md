# EV Ranger 2.0

Know how far you’ll go.

Compare electric vehicles under the same driving conditions. Explore approximate
range areas for up to three cars, browse places within reach, then compare
specific drives in Trips.

EV Ranger helps shoppers understand how different vehicles could fit their lives.
Explore provides a broad planning baseline; Trips adds route-specific detail.
It does not plan charging stops or provide turn-by-turn navigation.

Built with React, TypeScript, Vite, TanStack Query and Mapbox GL JS. Location,
routing, weather and elevation requests go through the separate
[EV Ranger API](https://github.com/hkidd/ev-ranger-api).

## Local development

Use Node **22.13.0 or newer within Node 22**, and npm. Start the
[API](https://github.com/hkidd/ev-ranger-api#readme) on port 3001, then run:

```sh
npm ci
cp .env.example .env.development.local
```

Set `VITE_MAPBOX_TOKEN` in `.env.development.local` to your public browser token,
then start the frontend:

```sh
npm run dev
```

Open `http://127.0.0.1:5174/compare`. Vite proxies `/api` requests to
`http://127.0.0.1:3001`. Restart the development server after changing environment
variables.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_MAPBOX_TOKEN` | Public browser token required to display the map |
| `VITE_API_BASE_URL` | API base for production builds, including `/api` |
| `VITE_BUYER_API_BASE_URL` | Optional location/routing API override in any mode |
| `VITE_VEHICLE_CATALOG_BASE_URL` | Optional hosted catalog base, including a trailing slash |

Development uses the Vite proxy for location, routing and weather unless
`VITE_BUYER_API_BASE_URL` is set. `VITE_API_BASE_URL` is used by production builds.
The catalog has its own URL setting and otherwise uses the defaults described
below.

All `VITE_*` values are public and embedded at build time. Keep secret Mapbox,
TomTom and storage credentials in the API or publishing environment. Local
environment files are ignored; `.env.example` documents the shared settings.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend on port 5174 |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build on port 4174 |
| `npm run lint` | Run ESLint |
| `npm run format:check` | Check source and tooling formatting |
| `npm test` | Run regression tests |
| `npm run check` | Run lint, formatting, tests and the production build |

Preview has no development API proxy. Set `VITE_API_BASE_URL` before building,
and allow `http://127.0.0.1:4174` in the API's local CORS configuration when
previewing against a separate API.

## Features

- Explore opens by default with an approximate one-way range area for each car.
- Filter viewport POIs by interest and by any, every or one comparison vehicle.
  Clusters expand as the map zooms closer.
- Check a selected destination's actual road route and compare it in Trips.
- Save a starting point, up to five trips and three vehicle configurations locally.
- Compare charge, reserve, temperature and EPA city/highway/combined references.
- Check one-way or return roads, arrival estimates and charge-status coloring.
- Apply current-hour NWS temperature explicitly, or keep manual conditions.
- Optionally include elevation using entered usable battery capacity and loaded mass.
- Browse grouped EPA model/year records with source links and configuration controls.
- Use the optional first-use guide, Replay guide and interactive `/about` explainer.

The application routes are `/compare` and `/about`. Workspace data stays in browser
storage. Road geometry and computed estimates are refreshed rather than persisted.

## Models and data

Range areas use a one-way distance budget derived from EPA range, temperature,
starting charge and reserve. They do not include terrain. Detailed trip estimates
can apply the experimental elevation model when vehicle inputs and complete
coverage are available. Actual return journeys use return road geometry.

Weather describes the current hour, not arrival time. Charging stops, wind and
changing driving speeds are not modeled. The temperature and terrain adjustments
are general assumptions rather than calibrated measurements for each vehicle.

The EPA archive covers model years 2000 onward where records are available. Records
are configurations, not dealer inventory or verified retail trims. A configured
catalog Worker serves an index and immutable year shards independently of app
releases. Without an override, development uses the API's `/api/catalog/` files
and production uses the bundled snapshot. Hosted-catalog failures show an error
and retry action.

The API reads national US terrain through a read-only R2 Worker and returns route
profiles to the browser. A small bundled Colorado grid is available as an API
fallback. Coverage is checked per route.

## Deployment

Deploy and verify the matching API before the frontend. In the frontend Vercel
project, use Node 22.x, build command `npm run build` and output directory `dist`.
Set these public build variables:

```dotenv
VITE_MAPBOX_TOKEN=your-public-mapbox-browser-token
VITE_API_BASE_URL=https://ev-ranger-api.vercel.app/api
VITE_VEHICLE_CATALOG_BASE_URL=https://evranger-catalog.evranger.workers.dev/catalog-v1/
```

Rebuild after changing any `VITE_*` value. `vercel.json` handles direct navigation
to application routes. For the production domain, the API's `FRONTEND_URL` is
`https://www.evranger.io`. Preview deployments need their own allowed origin.

After deployment, check `/compare` and `/about` directly, load the catalog, choose
a starting point, inspect range areas and POIs, and compare a destination in Trips.
Confirm the saved workspace restores after reload. See the
[deployment runbook](https://github.com/hkidd/ev-ranger-api/blob/main/docs/deployment.md)
for API verification, catalog publishing and rollback.

## Validation

```sh
npm run check
```

This runs lint, formatting, tests and a production build. GitHub Actions runs the
same checks on pull requests and main pushes. Tests cover route energy, workspace
storage, catalog integrity and guide state. Browser checks should cover desktop
and phone layouts, map interactions and provider-failure states.

Generated catalog JSON and build assets are excluded from formatting. The Mapbox
module loads separately from the comparison and explainer code.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/modules/Buyer/` | Explore, Trips, vehicle selection and range calculations |
| `src/modules/About/` | Product explanation and interactive range example |
| `src/queries/carQuery.ts` | Catalog index and year-shard loading |
| `src/data/vehicleCatalog.ts` | EPA catalog parsing and adaptation |
| `src/context/` | Theme state |
| `scripts/` | Regression tests |
| `public/data/` | Bundled catalog fallback |
| `docs/` | Model assumptions and maintenance guidance |

Catalog refresh and terrain publishing tools live in the API repository.

## Documentation

- [Discovery and weather](docs/discovery-weather.md)
- [Terrain energy model](docs/terrain-energy-model.md)
- [Elevation and temperature inputs](docs/elevation-temperature-model.md)
- [Vehicle configurations](docs/vehicle-configurations.md)
- [Dependency notes](DEPENDENCIES.md)
- [Development priorities](docs/development-backlog.md)

## License

[MIT](LICENSE).
