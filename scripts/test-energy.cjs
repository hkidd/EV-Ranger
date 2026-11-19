const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript')
const modules = new Map()
function load(filename) {
  filename = path.resolve(filename)
  if (modules.has(filename)) return modules.get(filename)
  const exports = {}
  modules.set(filename, exports)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name.startsWith('.'))
        return load(path.resolve(path.dirname(filename), `${name}.ts`))
      return require(name)
    }
  })
  return exports
}
const { calculateRouteEnergy, chargeBreakpoints } = load(
  'src/modules/Buyer/routeEnergy.ts'
)
const { estimateFit, routeSegments } = load('src/modules/Buyer/estimates.ts')
const scenario = { charge: 80, reserve: 15, temperature: 70, basis: 'combined' }
const inputs = { enabled: true, massKg: 2500, usableBatteryKwh: 100 }
const vehicle = {
  car: { brand: 'Fixture', model: 'Test', variants: [] },
  variant: { id: 'fixture', name: 'Fixture', range: 300 },
  terrain: inputs
}
function route(heights, distance = 16093.44, duration = 600) {
  return {
    distance,
    duration,
    roundTrip: false,
    geometry: {
      type: 'LineString',
      coordinates: heights.map((_, i) => [-105 + i * 0.01, 40])
    },
    segmentDistances: null,
    elevation: {
      status: 'available',
      samples: heights.map((height, i) => ({
        distanceMeters: (distance * i) / (heights.length - 1),
        elevationMeters: height
      }))
    }
  }
}
const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`)
test('flat route exactly preserves the EPA/temperature estimate', () => {
  const result = calculateRouteEnergy(route([100, 100]), scenario, 300, inputs)
  close(result.arrival, 80 - (10 / 300) * 100)
  close(result.terrainChargeDifference, 0)
  assert.equal(result.terrainStatus, 'applied')
})
test('uphill adds mgh/efficiency and downhill credits only bounded regeneration', () => {
  const up = calculateRouteEnergy(route([100, 1100]), scenario, 300, inputs)
  const down = calculateRouteEnergy(route([1100, 100]), scenario, 300, inputs)
  const potential = (2500 * 9.80665 * 1000) / 3600000
  close(up.terrainChargeDifference, -potential / 0.9)
  close(down.terrainChargeDifference, potential * 0.65)
  assert(up.arrival < up.baselineArrival)
  assert(down.arrival > down.baselineArrival)
})
test('there-and-back elevation costs energy even when the endpoints match', () => {
  const result = calculateRouteEnergy(
    route([100, 1100, 100]),
    scenario,
    300,
    inputs
  )
  assert(result.terrainChargeDifference < 0)
})
test('regen cannot overfill the battery or exceed the modeled power limit', () => {
  const full = calculateRouteEnergy(
    route([9000, 0]),
    { ...scenario, charge: 100 },
    300,
    inputs
  )
  assert(full.arrival <= 100)
  const short = calculateRouteEnergy(
    route([1100, 100], 100, 1),
    scenario,
    300,
    inputs
  )
  assert(short.terrainChargeDifference <= 50 / 3600 + 1e-8)
})
test('mid-route depletion remains charge-needed even after a downhill recovery', () => {
  const result = calculateRouteEnergy(
    route([0, 1000, 0], 16093.44, 3600),
    { ...scenario, charge: 50 },
    300,
    { ...inputs, usableBatteryKwh: 10 }
  )
  assert(result.firstDepletionMeters !== null)
  assert(result.arrival > 0)
  const fit = estimateFit(
    { ...vehicle, terrain: { ...inputs, usableBatteryKwh: 10 } },
    route([0, 1000, 0], 16093.44, 3600),
    { ...scenario, charge: 50 }
  )
  assert.equal(fit.status, 'needs-charge')
})
test('missing, partial or malformed elevation and missing vehicle inputs fall back without a fabricated adjustment', () => {
  for (const altered of [
    { ...route([0, 100]), elevation: undefined },
    { ...route([0, 100]), elevation: { status: 'partial', samples: [] } },
    {
      ...route([0, 100]),
      elevation: {
        status: 'available',
        samples: [
          { distanceMeters: 0, elevationMeters: null },
          { distanceMeters: 16093.44, elevationMeters: 100 }
        ]
      }
    }
  ]) {
    const result = calculateRouteEnergy(altered, scenario, 300, inputs)
    assert.equal(result.terrainStatus, 'missing-elevation')
    close(result.arrival, result.baselineArrival)
  }
  const missing = calculateRouteEnergy(route([0, 100]), scenario, 300, {
    enabled: true
  })
  assert.equal(missing.terrainStatus, 'missing-inputs')
  close(missing.arrival, missing.baselineArrival)
})
test('temperature and starting charge remain inputs to the same energy calculation', () => {
  const cold = estimateFit(vehicle, route([100, 1100]), {
    ...scenario,
    temperature: 20
  })
  const mild = estimateFit(vehicle, route([100, 1100]), scenario)
  assert(cold.arrival < mild.arrival)
  const low = estimateFit(vehicle, route([100, 1100]), {
    ...scenario,
    charge: 10
  })
  assert(low.arrival < mild.arrival)
})
test('turning terrain off restores the baseline and route colors reflect early depletion', () => {
  const road = route([0, 1000, 0], 16093.44, 3600),
    settings = { ...scenario, charge: 50 }
  const option = { ...vehicle, terrain: { ...inputs, usableBatteryKwh: 10 } }
  const energy = calculateRouteEnergy(road, settings, 300, option.terrain)
  assert(
    chargeBreakpoints(energy, 15).some(
      (point) => point > 0 && point < road.distance / 2
    )
  )
  const features = routeSegments(road, option, settings).features
  assert(
    features.some((feature) => feature.properties.status === 'needs-charge')
  )
  assert.equal(features.at(-1).properties.status, 'needs-charge')
  const off = calculateRouteEnergy(road, settings, 300, {
    ...inputs,
    enabled: false
  })
  close(off.arrival, off.baselineArrival)
  assert.equal(off.terrainStatus, 'disabled')
})
const { fullRange } = load('src/modules/Buyer/estimates.ts')
const { reachBudget, boundaryKey } = load('src/modules/Buyer/reachModel.ts')
const { weatherCoordinates } = load('src/modules/Buyer/weatherModel.ts')
test('city and highway references use available EPA data and fall back to combined', () => {
  const option = {
    ...vehicle,
    variant: { ...vehicle.variant, rangeCityMiles: 350, rangeHighwayMiles: 250 }
  }
  assert.equal(fullRange(option, { ...scenario, basis: 'city' }).range, 350)
  assert.equal(fullRange(option, { ...scenario, basis: 'highway' }).range, 250)
  assert.equal(
    fullRange(vehicle, { ...scenario, basis: 'city' }).referenceBasis,
    'combined'
  )
})
test('reach budget respects reserve, temperature and the selected driving reference', () => {
  close(reachBudget(vehicle, scenario), Math.round(300 * 0.65 * 1609.344))
  assert.equal(reachBudget(vehicle, { ...scenario, charge: 10 }), 0)
  assert(
    reachBudget(vehicle, { ...scenario, temperature: 20 }) <
      reachBudget(vehicle, scenario)
  )
  const place = { coordinates: [0, 0] }
  assert.notEqual(
    boundaryKey(place, vehicle, scenario),
    boundaryKey(place, vehicle, { ...scenario, charge: 90 })
  )
})
test('weather samples use distance along a route rather than its vertex index', () => {
  const road = {
    geometry: {
      coordinates: [
        [0, 0],
        [0.001, 0],
        [0.002, 0],
        [2, 0]
      ]
    },
    segmentDistances: null
  }
  const samples = weatherCoordinates(road, null)
  close(samples[1][0], 1)
  assert.deepEqual(samples[0], [0, 0])
  assert.deepEqual(samples.at(-1), [2, 0])
  assert.equal(
    JSON.stringify(weatherCoordinates(undefined, { coordinates: [1, 2] })),
    '[[1,2]]'
  )
})
const { visibleDiscoveryPlaces } = load('src/modules/Buyer/reachModel.ts')
test('discovery filter uses route energy for all cars and preserves unverified results', () => {
  const short = {
    ...vehicle,
    variant: { ...vehicle.variant, range: 30 },
    terrain: undefined
  }
  const long = { ...vehicle, terrain: undefined }
  const near = { id: 'near', route: route([0, 0], 16093.44) },
    far = { id: 'far', route: route([0, 0], 200000) },
    pending = { id: 'pending' },
    failed = { id: 'failed', error: 'No route' }
  const result = { places: [near, far, pending, failed] }
  assert.equal(
    visibleDiscoveryPlaces(result, [short], scenario, true).length,
    3
  )
  assert.equal(
    visibleDiscoveryPlaces(result, [short, long], scenario, true).length,
    4
  )
  assert.equal(
    visibleDiscoveryPlaces(result, [short], scenario, false).length,
    4
  )
  assert.equal(
    visibleDiscoveryPlaces(
      { places: [near] },
      [short],
      { ...scenario, charge: 20 },
      true
    ).length,
    0
  )
})

const { reachAreaFeatures } = load('src/modules/Buyer/reachModel.ts')
test('reach areas compare cars together and discard stale budgets', () => {
  const origin = { coordinates: [-105, 40] },
    first = { ...vehicle, car: { ...vehicle.car, id: 'a' } },
    second = {
      ...vehicle,
      car: { ...vehicle.car, id: 'b' },
      variant: { ...vehicle.variant, range: 150 }
    }
  const polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 0]
      ]
    ]
  }
  const result = {
    boundaries: [first, second].map((option) => ({
      vehicleId: option.car.id,
      key: boundaryKey(origin, option, scenario),
      geometry: polygon
    }))
  }
  const areas = reachAreaFeatures(
    result,
    origin,
    [first, second],
    scenario,
    'a',
    true
  )
  assert.equal(areas.features.length, 2)
  assert.notEqual(
    areas.features[0].properties.color,
    areas.features[1].properties.color
  )
  assert.equal(areas.features[0].properties.active, true)
  assert.equal(
    reachAreaFeatures(
      result,
      origin,
      [first, second],
      { ...scenario, temperature: 20 },
      'a',
      true
    ).features.length,
    0
  )
})

const { inReach, explorationBounds, inExplorationBounds } = load(
  'src/modules/Buyer/exploration.ts'
)
test('exploration clips points to polygons, excludes holes, and handles the date line', () => {
  const polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0]
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]
    ]
  }
  assert.equal(inReach([3, 3], polygon), true)
  assert.equal(inReach([1.5, 1.5], polygon), false)
  assert.equal(inReach([5, 3], polygon), false)
  assert.equal(inReach([0, 3], polygon), true)
  const dateLine = {
    type: 'Polygon',
    coordinates: [
      [
        [179, 50],
        [-179, 50],
        [-179, 52],
        [179, 52],
        [179, 50]
      ]
    ]
  }
  assert.equal(inReach([-179.5, 51], dateLine), true)
  assert.equal(inReach([0, 51], dateLine), false)
  const bounds = explorationBounds(
    { west: 178, east: 183, south: 49, north: 53, zoom: 6 },
    [dateLine],
    [179.5, 51]
  )
  assert.deepEqual(Array.from(bounds), [179, 50, 181, 52])
  assert.equal(
    explorationBounds(
      { west: 10, east: 15, south: 10, north: 15, zoom: 6 },
      [polygon],
      [0, 0]
    ),
    null
  )
})

test('retained viewport POIs include both northern and southern halves and wrap across the date line', () => {
  assert.equal(inExplorationBounds([-105, 40.5], [-107, 38, -103, 42]), true)
  assert.equal(inExplorationBounds([-105, 38.5], [-107, 38, -103, 42]), true)
  assert.equal(inExplorationBounds([-105, 43], [-107, 38, -103, 42]), false)
  assert.equal(inExplorationBounds([-179.5, 51], [179, 50, 181, 52]), true)
  assert.equal(inExplorationBounds([0, 51], [179, 50, 181, 52]), false)
})

const { tripCameraFrame } = load('src/modules/Buyer/mapCamera.ts')
test('trip terrain enrichment preserves a panned camera frame while navigation changes it', () => {
  const origin = { coordinates: [-105, 40] }
  const original = {
    id: 'mountain-trip',
    place: { coordinates: [-105.5, 40.2] },
    route: route([100, 1100])
  }
  const before = tripCameraFrame(origin, [original], original)
  const enriched = {
    ...original,
    status: 'ready',
    route: {
      ...original.route,
      elevation: { ...original.route.elevation, ascentMeters: 1000 }
    }
  }
  assert.equal(tripCameraFrame(origin, [enriched], enriched), before)
  const other = { ...enriched, id: 'other-trip' }
  assert.notEqual(tripCameraFrame(origin, [enriched, other], other), before)
  const returnJourney = {
    ...original,
    route: {
      ...original.route,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-105, 40],
          [-105.5, 40.2],
          [-105, 40]
        ]
      }
    }
  }
  assert.notEqual(
    tripCameraFrame(origin, [returnJourney], returnJourney),
    before
  )
})
test('camera frames handle origin-only and pending trips before road geometry arrives', () => {
  const origin = { coordinates: [-105, 40] }
  assert.deepEqual(
    JSON.parse(tripCameraFrame(origin, [], undefined)).coordinates,
    [[-105, 40]]
  )
  const pending = {
    id: 'pending',
    place: { coordinates: [-106, 41] },
    route: null
  }
  const frame = tripCameraFrame(origin, [pending], pending)
  assert.deepEqual(JSON.parse(frame).coordinates, [
    [-105, 40],
    [-106, 41]
  ])
  const ready = { ...pending, route: route([100, 200]) }
  assert.notEqual(tripCameraFrame(origin, [ready], ready), frame)
  assert.deepEqual(
    JSON.parse(tripCameraFrame(null, [], undefined)).coordinates,
    []
  )
})
