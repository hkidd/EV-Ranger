# EV Ranger 2.0 — reach, discovery and weather

The main comparison workspace supports city, highway or combined EPA references,
manual temperature, starting charge and reserve. Missing city/highway values fall
back explicitly to combined range. Existing saved workspaces remain compatible.

## Discover & reach

Explore opens by default. Choose an origin and up to three comparison cars. One-way TomTom
range areas are requested automatically from each car's EPA/temperature distance
budget after starting charge and reserve are applied. Identical budgets share a
request. Changing the origin, selected cars or budget invalidates old areas.

Filters cover parks/outdoors, attractions, museums and camping. Places can be
restricted to any car's area, all cars' areas, or one selected car. The API searches
four cells in the visible intersection of the range areas and map viewport, up to
50 results per category/cell. Date-line cells are split. The client clips points
to the actual range polygons, including holes. This replaces the six-destination
radius sampler; the old `/tomtom/pois` endpoint remains for compatibility.

POIs use a clustered GeoJSON source rather than hundreds of DOM markers. Dots and
clusters use interest colors; clusters show the dominant interest and a loaded
point count. Clicking a cluster zooms to its expansion level. Individual labels
appear at closer zoom. Pan/zoom refreshes the visible results after a 600 ms
debounce; a keyboard-accessible List control offers the same destination selection. The
compact map toolbar groups interests and car-range scope, with optional List and
About panels beneath it. Partial-result and zoom hints remain visible in its status
row; the longer model/directory explanation opens under About.

The provider's directory and ranking are not exhaustive. Truncated cells explicitly
invite a closer zoom; cluster counts describe loaded POIs, not every business in a
region. Searches use bounded concurrency, shared pending requests and a five-minute
bounded server cache. Partial failures remain explicit and are not cached as a
complete result. Search starts are paced at least 350 ms apart per API instance,
with cooldown and retries for provider 429 responses. Jobs alternate viewport cells
for each category so upper areas are not consistently searched last. This stays
below the documented [default Search limit of 5 QPS](https://docs.tomtom.com/platform/documentation/api-best-practices/qps-limits)
within an instance; separate serverless instances still share the provider account limit.

Stale browser requests are cancelled on changing map/filter inputs. Shared searches
continue while another client needs them; the last client disconnect cancels queued
and in-flight provider work. Matching places already loaded inside the new viewport
remain visible while its replacement search loads.

After narrowing the shortlist, Trips supports detailed comparisons of familiar
drives. Selecting a destination in Explore checks only that destination's Mapbox road route and optional
R2 elevation, shared by all cars. Users can check one way or the actual return route,
compare per-car arrival estimates, and add the place to the five-trip workspace.
Selecting another place cancels the old route check. Panning retains the selected
place's details; route enrichment does not move the camera.

**The area is still a theoretical distance budget, not a terrain-aware energy
contour.** The selected route can apply terrain when usable battery/loaded weight
inputs and complete elevation are available. Return route checks do not halve the
one-way polygon or claim it represents return range. This generalist spider is the
accepted launch baseline for vehicle discovery and comparison. Terrain-aware
contours are a later experiment: evaluate the provider's energy-based reachable
range with verified consumption, battery and mass profiles, and validate it against
detailed routes before making stronger accuracy claims.

Provider keys stay server-side. Places/range areas: TomTom. Checked roads: Mapbox.
Discovery results and weather are transient, not persisted battery promises.

## Weather

POST /api/weather samples up to three points: start, route midpoint and end. The
NWS point API resolves a current-hour forecast, with temperature, summary, wind
and validity times. This is a forecast snapshot, not a live station observation
or an arrival-time forecast. No forecast is fabricated outside NWS coverage.

“Use sampled temperature” explicitly sets the shared comparison temperature to
the sample mean. Manual temperature controls remain available. Wind/precipitation
are not included in the energy model. The generic temperature factor remains an
uncalibrated heuristic, not measured performance for every trim.

NWS data is free for any purpose, subject to reasonable rate limits:
https://www.weather.gov/documentation/services-web-api
TomTom and Mapbox still require separate commercial/redistribution review before
licensing the product. Keep provider access behind adapters so it can be changed.

## Validation

Run `npm run check` for lint, formatting, regression tests and the production build.
See [DEPENDENCIES.md](../DEPENDENCIES.md) for runtime and tooling requirements.
