import type {
  LifeTrip,
  Place,
  Scenario,
  VehicleOption,
  TerrainInputs
} from './types'

export const WORKSPACE_KEY = 'evranger.buyer-workspace.v1'
export const DEFAULT_SCENARIO: Scenario = {
  charge: 80,
  reserve: 15,
  temperature: 70,
  basis: 'highway'
}
export interface WorkspaceSnapshot {
  version: 1
  origin: Place | null
  trips: LifeTrip[]
  shortlist: string[]
  configurations: Record<string, string>
  terrainInputs: Record<string, TerrainInputs>
  activeVehicle: string
  activeTripId: string
  scenario: Scenario
}
export interface WorkspaceStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 500
const epaId = (value: unknown): value is string =>
  typeof value === 'string' && /^epa-\d+$/.test(value)
const bounded = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max
function place(value: unknown): Place | null {
  if (
    !record(value) ||
    !identifier(value.id) ||
    typeof value.label !== 'string' ||
    !value.label.trim() ||
    value.label.length > 1000 ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length !== 2 ||
    !bounded(value.coordinates[0], -180, 180) ||
    !bounded(value.coordinates[1], -90, 90)
  )
    return null
  return {
    id: value.id,
    label: value.label,
    coordinates: [value.coordinates[0], value.coordinates[1]]
  }
}
export function emptyWorkspace(): WorkspaceSnapshot {
  return {
    version: 1,
    origin: null,
    trips: [],
    shortlist: [],
    configurations: {},
    terrainInputs: {},
    activeVehicle: '',
    activeTripId: '',
    scenario: { ...DEFAULT_SCENARIO }
  }
}

/** Treat device storage as untrusted input; salvage valid fields independently. */
export function parseWorkspace(raw: string | null): WorkspaceSnapshot {
  const snapshot = emptyWorkspace()
  if (!raw || raw.length > 100000) return snapshot
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return snapshot
  }
  if (!record(value) || value.version !== 1) return snapshot
  snapshot.origin = place(value.origin)
  const ids = new Set<string>()
  if (Array.isArray(value.trips)) {
    for (const item of value.trips) {
      if (
        !record(item) ||
        !identifier(item.id) ||
        ids.has(item.id) ||
        typeof item.label !== 'string' ||
        !item.label.trim() ||
        item.label.length > 1000 ||
        typeof item.roundTrip !== 'boolean'
      )
        continue
      const destination = place(item.place)
      if (!destination) continue
      ids.add(item.id)
      // Always refresh road geometry; a saved battery estimate is not a current result.
      snapshot.trips.push({
        id: item.id,
        label: item.label,
        place: destination,
        roundTrip: item.roundTrip,
        route: null,
        status: 'idle'
      })
      if (snapshot.trips.length === 5) break
    }
  }
  if (Array.isArray(value.shortlist))
    snapshot.shortlist = [...new Set(value.shortlist.filter(epaId))].slice(0, 3)
  if (record(value.configurations))
    snapshot.configurations = Object.fromEntries(
      Object.entries(value.configurations)
        .filter(
          (entry): entry is [string, string] =>
            identifier(entry[0]) && epaId(entry[1])
        )
        .slice(0, 1000)
    )
  if (record(value.terrainInputs)) {
    for (const [id, inputs] of Object.entries(value.terrainInputs).slice(
      0,
      1000
    )) {
      if (!epaId(id) || !record(inputs)) continue
      snapshot.terrainInputs[id] = {
        enabled: inputs.enabled === true,
        ...(bounded(inputs.massKg, 400, 10000)
          ? { massKg: inputs.massKg }
          : {}),
        ...(bounded(inputs.usableBatteryKwh, 5, 300)
          ? { usableBatteryKwh: inputs.usableBatteryKwh }
          : {})
      }
    }
  }
  if (
    typeof value.activeVehicle === 'string' &&
    snapshot.shortlist.includes(value.activeVehicle)
  )
    snapshot.activeVehicle = value.activeVehicle
  if (typeof value.activeTripId === 'string' && ids.has(value.activeTripId))
    snapshot.activeTripId = value.activeTripId
  if (record(value.scenario)) {
    const scenario = value.scenario
    if (bounded(scenario.charge, 0, 100))
      snapshot.scenario.charge = scenario.charge
    if (bounded(scenario.reserve, 0, 40))
      snapshot.scenario.reserve = scenario.reserve
    if (bounded(scenario.temperature, -20, 120))
      snapshot.scenario.temperature = scenario.temperature
    if (
      scenario.basis === 'highway' ||
      scenario.basis === 'combined' ||
      scenario.basis === 'city'
    )
      snapshot.scenario.basis = scenario.basis
  }
  return snapshot
}
export function readWorkspace(storage?: WorkspaceStorage): {
  snapshot: WorkspaceSnapshot
  available: boolean
} {
  try {
    return {
      snapshot: parseWorkspace(
        (storage ?? window.localStorage).getItem(WORKSPACE_KEY)
      ),
      available: true
    }
  } catch {
    return { snapshot: emptyWorkspace(), available: false }
  }
}
export function saveWorkspace(
  snapshot: WorkspaceSnapshot,
  storage?: WorkspaceStorage
): boolean {
  try {
    const { trips, ...rest } = snapshot
    ;(storage ?? window.localStorage).setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        ...rest,
        trips: trips.map(({ id, label, place, roundTrip }) => ({
          id,
          label,
          // A discovery place can carry a full route/profile in memory. Persist
          // only its location so cached provider results cannot bloat storage.
          place: {
            id: place.id,
            label: place.label,
            coordinates: place.coordinates
          },
          roundTrip
        }))
      })
    )
    return true
  } catch {
    return false
  }
}

/** Drop retired records and collapse duplicate model/year slots after catalog changes. */
export function reconcileWorkspace(
  snapshot: WorkspaceSnapshot,
  options: VehicleOption[]
): WorkspaceSnapshot {
  const available = new Map(
    options.map((option) => [option.variant.id, option])
  )
  const cars = new Set<string>()
  const shortlist = snapshot.shortlist.filter((id) => {
    const option = available.get(id)
    if (!option || cars.has(option.car.id)) return false
    cars.add(option.car.id)
    return true
  })
  const configurations = Object.fromEntries(
    Object.entries(snapshot.configurations).filter(
      ([carId, id]) => available.get(id)?.car.id === carId
    )
  )
  return {
    ...snapshot,
    shortlist,
    configurations,
    activeVehicle: shortlist.includes(snapshot.activeVehicle)
      ? snapshot.activeVehicle
      : (shortlist[0] ?? '')
  }
}
