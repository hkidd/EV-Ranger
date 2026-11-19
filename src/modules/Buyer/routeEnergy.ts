import type { RoadRoute, Scenario, TerrainInputs } from './types'

export const ENERGY_MODEL = {
  version: 'terrain-v1',
  uphillEfficiency: 0.9,
  regenEfficiency: 0.65,
  maxRegenKw: 50,
  elevationDeadbandMeters: 5
} as const
const METERS_PER_MILE = 1609.344
export interface ChargePoint {
  distanceMeters: number
  charge: number
}
export interface RouteEnergy {
  points: ChargePoint[]
  arrival: number
  baselineArrival: number
  terrainChargeDifference: number
  firstDepletionMeters: number | null
  terrainStatus: 'applied' | 'disabled' | 'missing-inputs' | 'missing-elevation'
}
export function validTerrainInputs(
  inputs?: TerrainInputs
): inputs is TerrainInputs & { massKg: number; usableBatteryKwh: number } {
  return Boolean(
    inputs &&
    Number.isFinite(inputs.massKg) &&
    inputs.massKg! >= 400 &&
    inputs.massKg! <= 10000 &&
    Number.isFinite(inputs.usableBatteryKwh) &&
    inputs.usableBatteryKwh! >= 5 &&
    inputs.usableBatteryKwh! <= 300
  )
}
function usableElevation(route: RoadRoute) {
  const profile = route.elevation
  if (
    profile?.status !== 'available' ||
    profile.samples.length < 2 ||
    profile.samples.length > 512
  )
    return false
  const points = profile.samples
  if (
    points[0].distanceMeters !== 0 ||
    Math.abs(points[points.length - 1].distanceMeters - route.distance) > 2
  )
    return false
  return points.every(
    (point, index) =>
      Number.isFinite(point.elevationMeters) &&
      Number.isFinite(point.distanceMeters) &&
      point.distanceMeters >= 0 &&
      point.distanceMeters <= route.distance + 2 &&
      (!index || point.distanceMeters > points[index - 1].distanceMeters)
  )
}
function depletionDistance(points: ChargePoint[]): number | null {
  if (points[0].charge < 0) return 0
  for (let index = 1; index < points.length; index++) {
    if (points[index].charge < 0) {
      const before = points[index - 1],
        after = points[index]
      const fraction = before.charge / (before.charge - after.charge)
      return (
        before.distanceMeters +
        fraction * (after.distanceMeters - before.distanceMeters)
      )
    }
  }
  return null
}

/** EPA/temperature baseline plus a conservative incremental gravitational-energy estimate.
 * Efficiency and regen limits are explicit planning assumptions, not calibrated vehicle specs.
 */
export function calculateRouteEnergy(
  route: RoadRoute,
  scenario: Scenario,
  rangeMiles: number,
  inputs?: TerrainInputs
): RouteEnergy {
  const baselineArrival =
    scenario.charge - (route.distance / (rangeMiles * METERS_PER_MILE)) * 100
  const baseline = [
    { distanceMeters: 0, charge: scenario.charge },
    { distanceMeters: route.distance, charge: baselineArrival }
  ]
  let points = baseline
  const terrainStatus: RouteEnergy['terrainStatus'] = !inputs?.enabled
    ? 'disabled'
    : !validTerrainInputs(inputs)
      ? 'missing-inputs'
      : !usableElevation(route)
        ? 'missing-elevation'
        : 'applied'
  if (terrainStatus === 'applied' && validTerrainInputs(inputs)) {
    const samples = route.elevation!.samples
    const capacity = inputs.usableBatteryKwh
    let remaining = (capacity * scenario.charge) / 100
    let elevationAnchor = samples[0].elevationMeters!
    points = [{ distanceMeters: 0, charge: scenario.charge }]
    for (let index = 1; index < samples.length; index++) {
      const previous = samples[index - 1],
        current = samples[index]
      const distance =
        Math.min(route.distance, current.distanceMeters) -
        previous.distanceMeters
      const baselineKwh = (distance / (rangeMiles * METERS_PER_MILE)) * capacity
      const elevation = current.elevationMeters!
      const delta = elevation - elevationAnchor
      const retainedDelta =
        Math.abs(delta) >= ENERGY_MODEL.elevationDeadbandMeters ||
        index === samples.length - 1
          ? delta
          : 0
      if (retainedDelta) elevationAnchor = elevation
      const gravityKwh = (inputs.massKg * 9.80665 * retainedDelta) / 3600000
      const hours =
        route.duration > 0
          ? ((route.duration / 3600) * distance) / route.distance
          : 0
      const uphillKwh = Math.max(0, gravityKwh) / ENERGY_MODEL.uphillEfficiency
      const recoveredKwh = Math.min(
        Math.max(0, -gravityKwh) * ENERGY_MODEL.regenEfficiency,
        ENERGY_MODEL.maxRegenKw * hours,
        Math.max(0, capacity - remaining + baselineKwh)
      )
      remaining = Math.min(
        capacity,
        remaining - baselineKwh - uphillKwh + recoveredKwh
      )
      points.push({
        distanceMeters: Math.min(route.distance, current.distanceMeters),
        charge: (remaining / capacity) * 100
      })
    }
  }
  const arrival = points[points.length - 1].charge
  return {
    points,
    arrival,
    baselineArrival,
    terrainChargeDifference: arrival - baselineArrival,
    firstDepletionMeters: depletionDistance(points),
    terrainStatus
  }
}

export function chargeAtDistance(
  points: ChargePoint[],
  distance: number
): number {
  let low = 0,
    high = points.length - 1
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (points[middle].distanceMeters <= distance) low = middle
    else high = middle
  }
  const before = points[low],
    after = points[high]
  const length = after.distanceMeters - before.distanceMeters
  const fraction =
    length > 0
      ? Math.max(0, Math.min(1, (distance - before.distanceMeters) / length))
      : 0
  return before.charge + (after.charge - before.charge) * fraction
}

/** Include profile bends and threshold crossings so road colors match the energy trace. */
export function chargeBreakpoints(
  energy: RouteEnergy,
  reserve: number
): number[] {
  const cuts = energy.points.map((point) => point.distanceMeters)
  for (let index = 1; index < energy.points.length; index++) {
    const before = energy.points[index - 1],
      after = energy.points[index]
    for (const threshold of [reserve, 0]) {
      if ((before.charge - threshold) * (after.charge - threshold) < 0) {
        const fraction =
          (before.charge - threshold) / (before.charge - after.charge)
        cuts.push(
          before.distanceMeters +
            fraction * (after.distanceMeters - before.distanceMeters)
        )
      }
    }
  }
  return [...new Set(cuts)].sort((a, b) => a - b)
}
