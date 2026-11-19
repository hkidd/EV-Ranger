# Dependencies

Both EV Ranger repositories target Node 22.13+ within Node 22 and use committed
npm lockfiles. Install with `npm ci` to reproduce the tested package tree.

## Runtime

The frontend uses React, React Router, TanStack Query, Mapbox GL, React Icons and
Public Sans. Styling is maintained in the application CSS. The Mapbox module and
its stylesheet load separately from the comparison and explainer code.

The API uses Express, CORS, Helmet, express-rate-limit and dotenv. Provider
adapters use HTTP requests. GDAL is required for offline raster preparation and
synthetic raster tests; deployed portable terrain grids do not require it.

## Version constraints

- TypeScript uses `~6.0.3` in both repositories. Keep it compatible with the lint
  tooling and the frontend tests that use the compiler API.
- The API's Node types follow the Node 22 runtime.
- The minimatch override addresses a transitive lint-tool dependency. Revisit it
  when the parent dependency updates its requirement.
- AWS S3 and Wrangler are development dependencies used by maintenance and
  publishing scripts, not browser code.

## Updating packages

Update manifests and lockfiles together. Run `npm run check` in both repositories
and check the browser at desktop and phone widths after frontend changes. Check
provider errors, catalog loading and terrain fallback after API changes. CI runs
the HTTP contracts over TCP; local tests also support paired in-memory streams.

Run `npm audit` when updating or releasing. Advisory checks on November 19, 2026
returned no advisories for the locked frontend or API package versions, including
development and optional dependencies. This result applies to that package tree
and date.
