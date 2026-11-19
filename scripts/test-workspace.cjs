const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const exportsForStorage = {}
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/modules/Buyer/workspaceStorage.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      }
    }
  ).outputText,
  { exports: exportsForStorage }
)
const {
  emptyWorkspace,
  parseWorkspace,
  readWorkspace,
  saveWorkspace,
  reconcileWorkspace,
  WORKSPACE_KEY
} = exportsForStorage
const plain = (value) => JSON.parse(JSON.stringify(value))
const origin = {
  id: 'denver',
  label: 'Denver, Colorado',
  coordinates: [-104.99, 39.74]
}
const trip = {
  id: 'trip-1',
  label: 'Boulder',
  place: {
    id: 'boulder',
    label: 'Boulder, Colorado',
    coordinates: [-105.27, 40.01]
  },
  roundTrip: true,
  status: 'ready',
  route: { distance: 99999 }
}
function saved() {
  return {
    ...emptyWorkspace(),
    origin,
    trips: [trip],
    shortlist: ['epa-123', 'epa-456'],
    activeVehicle: 'epa-456',
    activeTripId: trip.id,
    configurations: { car: 'epa-123' },
    scenario: { charge: 90, reserve: 20, temperature: 32, basis: 'combined' }
  }
}
test('restores cars, exact setups, places, journey type, selection and scenario', () => {
  const result = parseWorkspace(JSON.stringify(saved()))
  assert.deepEqual(plain(result.origin), origin)
  assert.deepEqual(plain(result.shortlist), ['epa-123', 'epa-456'])
  assert.deepEqual(plain(result.configurations), { car: 'epa-123' })
  assert.deepEqual(plain(result.scenario), saved().scenario)
  assert.equal(result.activeTripId, trip.id)
  assert.equal(result.activeVehicle, 'epa-456')
  assert.equal(result.trips[0].roundTrip, true)
  assert.equal(result.trips[0].status, 'idle')
  assert.equal(result.trips[0].route, null)
})
test('does not persist route geometry, stale results, or transient errors', () => {
  let payload
  assert(
    saveWorkspace(saved(), {
      setItem(key, value) {
        assert.equal(key, WORKSPACE_KEY)
        payload = JSON.parse(value)
      }
    })
  )
  assert.deepEqual(Object.keys(payload.trips[0]).sort(), [
    'id',
    'label',
    'place',
    'roundTrip'
  ])
  assert.equal(payload.trips[0].route, undefined)
})
test('corrupt, huge or unsupported saved workspaces fall back safely', () => {
  for (const raw of [
    null,
    '{',
    'null',
    '[]',
    JSON.stringify({ ...saved(), version: 2 }),
    'x'.repeat(100001)
  ]) {
    assert.deepEqual(plain(parseWorkspace(raw)), plain(emptyWorkspace()))
  }
})
test('rejects invalid coordinates and salvages independent valid fields', () => {
  const result = parseWorkspace(
    JSON.stringify({
      ...saved(),
      origin: { ...origin, coordinates: [200, 40] },
      trips: [{ ...trip, place: { ...origin, coordinates: ['0', 1] } }, trip],
      scenario: { charge: -1, reserve: 50, temperature: 32, basis: 'invented' }
    })
  )
  assert.equal(result.origin, null)
  assert.equal(result.trips.length, 1)
  assert.equal(result.scenario.charge, 80)
  assert.equal(result.scenario.reserve, 15)
  assert.equal(result.scenario.temperature, 32)
  assert.equal(result.scenario.basis, 'highway')
})
test('limits trips and shortlist, deduplicates IDs, and ignores orphaned selections', () => {
  const result = parseWorkspace(
    JSON.stringify({
      ...saved(),
      trips: Array.from({ length: 7 }, (_, i) => ({
        ...trip,
        id: `trip-${i}`
      })),
      shortlist: ['epa-1', 'epa-1', 'bad', 'epa-2', 'epa-3', 'epa-4'],
      activeVehicle: 'epa-999',
      activeTripId: 'gone'
    })
  )
  assert.equal(result.trips.length, 5)
  assert.deepEqual(plain(result.shortlist), ['epa-1', 'epa-2', 'epa-3'])
  assert.equal(result.activeVehicle, '')
  assert.equal(result.activeTripId, '')
})
test('blocked reads or quota failures leave the app usable', () => {
  const blocked = {
    getItem() {
      throw Error('blocked')
    },
    setItem() {
      throw Error('quota')
    }
  }
  assert.equal(readWorkspace(blocked).available, false)
  assert.deepEqual(
    plain(readWorkspace(blocked).snapshot),
    plain(emptyWorkspace())
  )
  assert.equal(saveWorkspace(saved(), blocked), false)
})
test('catalog reconciliation removes retired records and duplicate models, preserving places', () => {
  const source = {
    ...saved(),
    shortlist: ['epa-123', 'epa-456', 'epa-999'],
    activeVehicle: 'epa-999',
    configurations: { car: 'epa-123', retired: 'epa-999', other: 'epa-456' }
  }
  const result = reconcileWorkspace(source, [
    { car: { id: 'car' }, variant: { id: 'epa-123' } },
    { car: { id: 'car' }, variant: { id: 'epa-456' } }
  ])
  assert.deepEqual(plain(result.shortlist), ['epa-123'])
  assert.deepEqual(plain(result.configurations), { car: 'epa-123' })
  assert.equal(result.activeVehicle, 'epa-123')
  assert.equal(result.origin, origin)
  assert.equal(result.trips, source.trips)
})
test('saving an empty workspace resets the next visit', () => {
  let raw = JSON.stringify(saved())
  const device = {
    getItem() {
      return raw
    },
    setItem(_, value) {
      raw = value
    }
  }
  assert(saveWorkspace(emptyWorkspace(), device))
  assert.deepEqual(
    plain(readWorkspace(device).snapshot),
    plain(emptyWorkspace())
  )
})

test('terrain inputs persist per exact EPA configuration and invalid values are discarded', () => {
  const parsed = parseWorkspace(
    JSON.stringify({
      ...saved(),
      terrainInputs: {
        'epa-123': { enabled: true, massKg: 2500, usableBatteryKwh: 90 },
        'epa-456': { enabled: true, massKg: -1, usableBatteryKwh: 99999 },
        bad: { enabled: true, massKg: 2000, usableBatteryKwh: 80 }
      }
    })
  )
  assert.deepEqual(plain(parsed.terrainInputs['epa-123']), {
    enabled: true,
    massKg: 2500,
    usableBatteryKwh: 90
  })
  assert.deepEqual(plain(parsed.terrainInputs['epa-456']), { enabled: true })
  assert.equal(parsed.terrainInputs.bad, undefined)
})

test('long discovery destination names survive saving and reloading without losing the trip', () => {
  const label = 'Compassion International Global Ministry Center Tours'
  const source = { ...saved(), trips: [{ ...trip, label }] }
  let raw
  assert(
    saveWorkspace(source, {
      setItem(_, value) {
        raw = value
      }
    })
  )
  const restored = parseWorkspace(raw)
  assert.equal(restored.trips.length, 1)
  assert.equal(restored.trips[0].label, label)
  assert.equal(restored.trips[0].route, null)
  const oversized = parseWorkspace(
    JSON.stringify({ ...source, trips: [{ ...trip, label: 'x'.repeat(1001) }] })
  )
  assert.equal(oversized.trips.length, 0)
})

test('saving an explored trip strips nested provider routes and terrain from its destination', () => {
  const discoveryPlace = {
    ...trip.place,
    category: 'parks',
    address: 'Provider address',
    error: 'Transient error',
    route: {
      geometry: { coordinates: Array(10000).fill([-105, 40]) },
      elevation: {
        samples: Array(10000).fill({ distanceMeters: 1, elevationMeters: 100 })
      }
    }
  }
  let raw
  assert(
    saveWorkspace(
      { ...saved(), trips: [{ ...trip, place: discoveryPlace }] },
      {
        setItem(_, value) {
          raw = value
        }
      }
    )
  )
  assert(
    raw.length < 100000,
    'Transient discovery data must not exceed the workspace restore limit'
  )
  const storedPlace = JSON.parse(raw).trips[0].place
  assert.deepEqual(storedPlace, trip.place)
  const restored = parseWorkspace(raw)
  assert.equal(restored.trips.length, 1)
  assert.deepEqual(plain(restored.trips[0].place), trip.place)
})
