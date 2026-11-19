import { vehicleColor } from './vehicleAppearance'
import { estimateFit, fullRange, MILES_TO_METERS } from './estimates'
import type { Place, Scenario, VehicleOption, DiscoveryResult } from './types'
export const originKey = (origin: Place | null) =>
  JSON.stringify(origin?.coordinates || null)
export const boundaryKey = (
  origin: Place,
  vehicle: VehicleOption,
  scenario: Scenario
) => JSON.stringify([origin.coordinates, reachBudget(vehicle, scenario)])
export function reachBudget(vehicle: VehicleOption, scenario: Scenario) {
  return Math.round(
    ((fullRange(vehicle, scenario).range *
      Math.max(0, scenario.charge - scenario.reserve)) /
      100) *
      MILES_TO_METERS
  )
}

export function visibleDiscoveryPlaces(
  result: DiscoveryResult,
  vehicles: VehicleOption[],
  scenario: Scenario,
  reachableOnly: boolean
) {
  return result.places.filter(
    (place) =>
      !reachableOnly ||
      !place.route ||
      vehicles.some(
        (vehicle) =>
          estimateFit(vehicle, place.route!, scenario).status === 'reserve-met'
      )
  )
}

/** Ignore stale budgets rather than leaving an old reach area under new conditions. */
export function reachAreaFeatures(
  result: DiscoveryResult | null,
  origin: Place | null,
  vehicles: VehicleOption[],
  scenario: Scenario,
  activeCarId: string | undefined,
  dark: boolean
): import('geojson').FeatureCollection<import('geojson').Polygon> {
  return {
    type: 'FeatureCollection',
    features: origin
      ? vehicles.flatMap((vehicle, slot) => {
          const area = result?.boundaries?.find(
            (area) =>
              area.vehicleId === vehicle.car.id &&
              area.key === boundaryKey(origin, vehicle, scenario)
          )
          return area
            ? [
                {
                  type: 'Feature' as const,
                  properties: {
                    vehicleId: vehicle.car.id,
                    color: vehicleColor(slot, dark),
                    active: vehicle.car.id === activeCarId
                  },
                  geometry: area.geometry
                }
              ]
            : []
        })
      : []
  }
}
