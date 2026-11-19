# Static elevation and temperature: implementation decision

## Elevation

The API samples USGS 3DEP elevation along the selected road route. National grid
assets are published to R2 and served through a read-only Worker. Local raster and
grid adapters remain available for development. Coverage and missing samples are
reported explicitly; ground elevation can differ from bridges and tunnels.

Profiles filter measurement noise before summing ascent and descent. Complete
profiles can feed the experimental terrain energy model when the user supplies
usable battery capacity and loaded mass. Explore boundaries remain distance-based
and do not include terrain.

See [terrain energy assumptions](terrain-energy-model.md), the
[API terrain adapters](https://github.com/hkidd/ev-ranger-api/blob/main/docs/terrain.md)
and [national terrain pipeline](https://github.com/hkidd/ev-ranger-api/blob/main/docs/national-terrain.md).

## Temperature

The current generic function is a prototype heuristic, with about 28% range loss
at 20°F and about 7% at 95°F. It is not measured trim-specific performance.

A useful reference is DOE/Argonne's 2024 program record. It reports average losses
of 41% at 20°F and 14% at 95°F relative to laboratory range at 72°F, with the cabin
held at 72°F. The lab sample and drive cycles differ from the individual vehicles
in Ranger's current catalog and the EPA label baseline. Do not describe those
averages as a calibrated forecast for every vehicle or directly equate lab range
at 72°F to each EPA label range.
[DOE report](https://www.energy.gov/cmei/vehicles/articles/program-record-impact-cold-ambient-temperature-and-extreme-conditions)
[Argonne summary](https://vms.taps.anl.gov/research-highlights/vehicle-technologies/bev-xtreme-weather/)

The next temperature implementation should use versioned, sourced profiles:
- a clearly labeled general planning profile with stated cabin/HVAC assumptions;
- vehicle-specific overrides only where comparable measured data exists;
- interpolation only between documented anchors, with explicit out-of-domain
  behavior rather than unexplained extrapolation;
- a visible temperature effect alongside the range estimate and a source link;
- tests for anchors, interpolation continuity, bounds and baseline normalization.

Do not stack an HVAC penalty on a temperature profile whose evidence already
includes cabin heating/cooling. Do not invent heat-pump improvements or a range
increase above the EPA label without a defensible normalization. Weather forecasts are displayed separately; wind, precipitation and traffic do
not affect the energy calculation.
