# Development priorities

EV Ranger focuses on vehicle comparison and destination discovery. Explore uses
an approximate road-distance range area; Trips provides the detailed route and
optional terrain estimate for a shortlisted vehicle.

## Model evidence

- Compare estimates with measured consumption and verified battery/mass data.
- Evaluate provider energy-based reach areas with validated vehicle profiles.
- Keep source dates and fallback behavior visible as vehicle data improves.

## Usability and performance

- Test map gestures and the Explore-to-Trips flow on physical phones.
- Measure map startup and interaction costs; the Mapbox bundle remains the largest
  separately loaded module.
- Validate accessibility and provider-failure states alongside visual changes.

## Operations

Keep catalog updates independent of application releases. Validate every published
shard, retain older immutable assets for cached clients, and verify the public
catalog after publication. See the API
[deployment](https://github.com/hkidd/ev-ranger-api/blob/main/docs/deployment.md) and
[catalog](https://github.com/hkidd/ev-ranger-api/blob/main/docs/hosted-catalog.md)
runbooks.
