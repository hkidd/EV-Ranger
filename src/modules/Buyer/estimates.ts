import type { FeatureCollection, LineString } from 'geojson'
import {
  calculateRouteEnergy,
  chargeAtDistance,
  chargeBreakpoints
} from './routeEnergy'
import { getTempModifier } from '../../utils/temperatureModifier'
import type {
  VehicleOption,
  RoadRoute,
  Scenario,
  FitEstimate,
  Coordinate
} from './types'
export const MILES_TO_METERS = 1609.344
export const vehicleTitle = (vehicle: VehicleOption) =>
  `${vehicle.car.modelYear ?? ''} ${vehicle.car.brand} ${vehicle.car.model}`.trim()
export function fullRange(vehicle: VehicleOption, scenario: Scenario) {
  const usedHighway =
    scenario.basis === 'highway' &&
    vehicle.variant.rangeHighwayMiles !== undefined
  const usedCity =
    scenario.basis === 'city' && vehicle.variant.rangeCityMiles !== undefined
  const rated = usedCity
    ? vehicle.variant.rangeCityMiles!
    : usedHighway
      ? vehicle.variant.rangeHighwayMiles!
      : vehicle.variant.range
  return {
    range: rated * getTempModifier(scenario.temperature),
    usedHighway,
    referenceBasis: usedCity ? 'city' : usedHighway ? 'highway' : 'combined'
  }
}
export function estimateFit(
  vehicle: VehicleOption,
  route: RoadRoute,
  scenario: Scenario
): FitEstimate {
  const { range, usedHighway } = fullRange(vehicle, scenario)
  const routeMiles = route.distance / MILES_TO_METERS
  const usableRange =
    (Math.max(0, scenario.charge - scenario.reserve) / 100) * range
  const energy = calculateRouteEnergy(route, scenario, range, vehicle.terrain)
  const { arrival } = energy
  return {
    routeMiles,
    fullRange: range,
    usableRange,
    arrival,
    margin:
      energy.firstDepletionMeters !== null
        ? Math.min(-0.001, usableRange - routeMiles)
        : ((arrival - scenario.reserve) / 100) * range,
    status:
      energy.firstDepletionMeters !== null
        ? 'needs-charge'
        : arrival >= scenario.reserve
          ? 'reserve-met'
          : arrival >= 0
            ? 'below-reserve'
            : 'needs-charge',
    usedHighway,
    baselineArrival: energy.baselineArrival,
    terrainChargeDifference: energy.terrainChargeDifference,
    terrainStatus: energy.terrainStatus
  }
}
function geodesic(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180
  const dlat = (b[1] - a[1]) * radians,
    dlng = (b[0] - a[0]) * radians
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a[1] * radians) *
      Math.cos(b[1] * radians) *
      Math.sin(dlng / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}
/** Follow provider road geometry; split only where the modeled charge crosses a threshold. */
export function routeSegments(
  route: RoadRoute,
  vehicle: VehicleOption | undefined,
  scenario: Scenario
): FeatureCollection<LineString> {
  const coordinates = route.geometry.coordinates
  if (!vehicle)
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { status: 'route' },
          geometry: route.geometry
        }
      ]
    }
  const { range } = fullRange(vehicle, scenario)
  const energy = calculateRouteEnergy(route, scenario, range, vehicle.terrain)
  const breakpoints = chargeBreakpoints(energy, scenario.reserve)
  const geometric = coordinates
    .slice(1)
    .map((point, i) => geodesic(coordinates[i], point))
  const raw = route.segmentDistances ?? geometric
  const sum = raw.reduce((a, b) => a + b, 0)
  const weights = raw.map((value) =>
    sum > 0 ? (value / sum) * route.distance : route.distance / raw.length
  )
  const features: FeatureCollection<LineString>['features'] = []
  let traveled = 0
  let nextBreakpoint = 0
  const append = (a: Coordinate, b: Coordinate, status: string) => {
    const previous = features[features.length - 1]
    if (previous?.properties?.status === status)
      previous.geometry.coordinates.push(b)
    else
      features.push({
        type: 'Feature',
        properties: { status },
        geometry: { type: 'LineString', coordinates: [a, b] }
      })
  }
  for (let i = 0; i < coordinates.length - 1; i++) {
    const distance = weights[i],
      end = traveled + distance
    while (
      nextBreakpoint < breakpoints.length &&
      breakpoints[nextBreakpoint] <= traveled
    )
      nextBreakpoint++
    const cuts = [traveled]
    while (
      nextBreakpoint < breakpoints.length &&
      breakpoints[nextBreakpoint] < end
    )
      cuts.push(breakpoints[nextBreakpoint++])
    cuts.push(end)
    for (let j = 0; j < cuts.length - 1; j++) {
      const interpolate = (at: number): Coordinate => {
        const fraction = distance > 0 ? (at - traveled) / distance : 0
        return [
          coordinates[i][0] +
            (coordinates[i + 1][0] - coordinates[i][0]) * fraction,
          coordinates[i][1] +
            (coordinates[i + 1][1] - coordinates[i][1]) * fraction
        ]
      }
      const midpoint = (cuts[j] + cuts[j + 1]) / 2
      append(
        interpolate(cuts[j]),
        interpolate(cuts[j + 1]),
        energy.firstDepletionMeters !== null &&
          midpoint >= energy.firstDepletionMeters
          ? 'needs-charge'
          : chargeAtDistance(energy.points, midpoint) >= scenario.reserve
            ? 'reserve-met'
            : 'below-reserve'
      )
    }
    traveled = end
  }
  return { type: 'FeatureCollection', features }
}
export const durationText = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`
}
