# Terrain energy model: experimental v1

`routeEnergy.ts` is a pure calculation module; `estimates.ts` uses it for arrival
charge and map coloring. `TerrainInputsEditor` is a separate reusable disclosure
inside each shortlisted vehicle card. Changing inputs or temperature runs local
calculations and does not fetch roads, elevation or weather again.

## Inputs and provenance

Per EPA configuration, the user supplies estimated total loaded mass (displayed
in pounds, stored in kg), usable battery capacity in kWh, and explicit opt-in.
Missing values are blank; no mass or usable capacity is invented from rated range.
Values save per exact configuration and survive reload. The catalog still needs
curated vehicle-specific profiles before automatic terrain estimates can cover it.

The example below uses 94.9 kWh and 5,400 lb for the Q6 example, as explicit
planning inputs, not a verified US MY2027 specification. Keep this distinction
when reviewing estimates. Manufacturer data can vary by market, year and trim.

## Calculation

1. Use selected EPA highway/combined range and the existing generic temperature
   factor as the reference consumption; do not change the temperature model here.
2. Traverse the complete sampled road elevation profile in distance order.
3. Baseline segment energy is usable capacity × segment miles / adjusted range.
4. Incremental uphill energy is `mass × 9.80665 × rise / 3,600,000 / 0.90` kWh.
5. Downhill credit is limited to 65% of descending gravitational energy, 50 kW ×
   estimated segment hours, and available battery headroom after baseline use.
6. Carry battery state through each segment. Remember the first depletion even
   if subsequent descent would produce a positive endpoint balance.

The 90% drive efficiency, 65% regeneration and 50 kW limit are generic engineering
assumptions in one versioned constant, not vehicle measurements. A five-meter
height hysteresis follows the profile's climb-counting convention to reduce DEM
noise. Segment hours use overall road duration distributed by distance, not live
traffic or measured segment speed. This model adds gravity to an EPA baseline;
it is not a full drivetrain simulation and does not explicitly model coasting,
HVAC load, cold-regeneration restrictions, battery aging or suspension/road surface.
Do not add a second HVAC penalty to the existing temperature factor.

Use complete elevation coverage only. Partial, absent or malformed coverage falls
back to the EPA/temperature baseline, with a visible status. No extrapolated heights
or terrain penalties are silently inserted into an uncovered road.

## Rendering and efficiency

The energy trace has at most 512 points. Map geometry retains real road coordinates;
energy/profile breakpoints split it where charge crosses the reserve or zero.
An ordered traversal and binary interpolation avoid a separate energy model per
map segment. Arrival results and route colors share the same function. Changing
vehicle assumptions does not reroute or recenter the map.

The comparison's reference trip range remains labeled “before terrain” because a
route-specific adjustment is not a new universal maximum driving range. A downhill
can improve the trip estimate without promising that increase in every direction.

## Verification

Energy tests cover flat/uphill/downhill/return, regeneration power/headroom,
mid-route depletion followed by recovery, invalid coverage, missing inputs,
temperature changes and route-color consistency. Saved-workspace tests
include per-configuration terrain inputs and invalid-value rejection.

Public Colorado routes were checked using 80% start, 15% reserve, mild-temperature
reference range 295 miles and the explicit Q6 planning inputs above:

| Road | Miles | Baseline arrival | With terrain |
| --- | ---: | ---: | ---: |
| Denver → Loveland Pass | 60 | 59.6% | 42.1% |
| Loveland Pass → Denver | 60 | 59.6% | 67.6% |
| Denver → pass → Denver | 122 | 38.6% | 29.1% |

These check directional behavior and losses on a return trip; they are not observed
battery consumption. Validate exact vehicle profiles and compare independent route
consumption evidence before treating the national rollout as calibrated.
