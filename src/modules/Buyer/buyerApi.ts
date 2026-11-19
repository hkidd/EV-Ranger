import type {
  Place,
  RoadRoute,
  Coordinate,
  ElevationProfile,
  WeatherSample
} from './types'

const base = (
  import.meta.env.VITE_BUYER_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_BASE_URL || '/api')
).replace(/\/$/, '')
async function post<T>(
  path: string,
  body: unknown,
  signal: AbortSignal
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  })
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error(
      'The location API returned an unreadable response. Check that the API is running.'
    )
  }
  if (!response.ok)
    throw new Error(
      data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof data.error === 'string'
        ? data.error
        : 'Location request failed. Please try again.'
    )
  return data as T
}
const coordinate = (value: unknown): value is Coordinate =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((item) => typeof item === 'number' && Number.isFinite(item)) &&
  Math.abs(value[0]) <= 180 &&
  Math.abs(value[1]) <= 90
export async function findPlaces(
  query: string,
  signal: AbortSignal,
  proximity?: Coordinate
): Promise<Place[]> {
  const data = await post<{
    features: { id: string; center: Coordinate; place_name: string }[]
  }>('/geocoding/search', { query, limit: 5, proximity }, signal)
  if (!Array.isArray(data.features))
    throw new Error('Location search returned an invalid result.')
  return data.features
    .filter(
      (item) => coordinate(item.center) && typeof item.place_name === 'string'
    )
    .map((item) => ({
      id: String(item.id),
      label: item.place_name,
      coordinates: item.center
    }))
}
export async function fetchRoadRoute(
  start: Coordinate,
  end: Coordinate,
  roundTrip: boolean,
  signal: AbortSignal
): Promise<RoadRoute> {
  const data = await post<{ route: RoadRoute }>(
    '/directions',
    { start, end, roundTrip },
    signal
  )
  const route = data.route
  if (
    !route ||
    route.geometry?.type !== 'LineString' ||
    !Array.isArray(route.geometry.coordinates) ||
    route.geometry.coordinates.length < 2 ||
    !route.geometry.coordinates.every(coordinate) ||
    !Number.isFinite(route.distance) ||
    route.distance <= 0 ||
    !Number.isFinite(route.duration)
  )
    throw new Error('The API returned an invalid driving route.')
  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    roundTrip,
    segmentDistances:
      Array.isArray(route.segmentDistances) &&
      route.segmentDistances.length === route.geometry.coordinates.length - 1 &&
      route.segmentDistances.every(
        (distance: unknown) =>
          typeof distance === 'number' &&
          Number.isFinite(distance) &&
          distance >= 0
      )
        ? route.segmentDistances
        : null
  }
}

/** Optional enrichment: never block the road result or vehicle comparison. */
export async function fetchRouteElevation(
  start: Coordinate,
  end: Coordinate,
  roundTrip: boolean,
  parent: AbortSignal
): Promise<ElevationProfile> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (parent.aborted) controller.abort()
  parent.addEventListener('abort', cancel, { once: true })
  const deadline = setTimeout(cancel, 15000)
  try {
    const data = await post<{ elevation: ElevationProfile }>(
      '/directions/elevation',
      { start, end, roundTrip },
      controller.signal
    )
    const profile = data.elevation
    if (
      !profile ||
      !['available', 'partial', 'unavailable'].includes(profile.status) ||
      !Array.isArray(profile.samples) ||
      profile.samples.length > 512 ||
      !Number.isFinite(profile.sampleSpacingMeters) ||
      profile.sampleSpacingMeters < 0 ||
      !profile.samples.every(
        (sample: ElevationProfile['samples'][number]) =>
          sample &&
          Number.isFinite(sample.distanceMeters) &&
          sample.distanceMeters >= 0 &&
          (sample.elevationMeters === null ||
            Number.isFinite(sample.elevationMeters))
      ) ||
      ![profile.ascentMeters, profile.descentMeters].every(
        (value) => value === null || (Number.isFinite(value) && value >= 0)
      )
    )
      throw new Error('Invalid elevation profile')
    return profile
  } finally {
    clearTimeout(deadline)
    parent.removeEventListener('abort', cancel)
  }
}

export async function findDiscoveryPlaces(
  bounds: [number, number, number, number],
  categories: string[],
  signal: AbortSignal
) {
  const data = await post<{
    data: {
      pois: {
        id: string
        name: string
        category: string
        longitude: number
        latitude: number
        address?: string
      }[]
    }
    partial?: boolean
    rateLimited?: boolean
    truncated?: boolean
  }>('/tomtom/explore', { bounds, categories }, signal)
  if (!Array.isArray(data.data?.pois) || data.data.pois.length > 1200)
    throw new Error('Discovery returned an invalid result.')
  const places = data.data.pois
    .filter(
      (p) =>
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        categories.includes(p.category) &&
        coordinate([p.longitude, p.latitude])
    )
    .map((p) => ({
      id: `poi:${p.id}`,
      label: p.name,
      address: String(p.address || ''),
      category: p.category,
      coordinates: [p.longitude, p.latitude] as Coordinate
    }))
  return {
    places,
    partial: data.partial === true,
    rateLimited: data.rateLimited === true,
    truncated: data.truncated === true
  }
}
export async function fetchReachBoundary(
  start: Coordinate,
  distance: number,
  signal: AbortSignal
): Promise<GeoJSON.Polygon> {
  const data = await post<{ geometry: GeoJSON.Polygon }>(
    '/tomtom/reachable-range',
    {
      longitude: start[0],
      latitude: start[1],
      distanceBudgetInMeters: distance
    },
    signal
  )
  const geometry = data.geometry
  if (
    geometry?.type !== 'Polygon' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length !== 1 ||
    geometry.coordinates[0].length < 4 ||
    !geometry.coordinates[0].every(coordinate)
  )
    throw new Error('Reach returned an invalid boundary.')
  return geometry
}
export async function fetchWeather(
  coordinates: Coordinate[],
  signal: AbortSignal
): Promise<import('./types').WeatherSample[]> {
  const data = await post<{ samples: WeatherSample[] }>(
    '/weather',
    { coordinates },
    signal
  )
  if (
    !Array.isArray(data.samples) ||
    data.samples.length !== coordinates.length
  )
    throw new Error('Weather returned an invalid result.')
  return data.samples.map(
    (sample: import('./types').WeatherSample, i: number) =>
      sample?.status === 'available' &&
      typeof sample.temperatureF === 'number' &&
      Number.isFinite(sample.temperatureF) &&
      typeof sample.validFrom === 'string' &&
      typeof sample.validTo === 'string' &&
      Date.parse(sample.validTo) > Date.now()
        ? { ...sample, coordinates: coordinates[i] }
        : { coordinates: coordinates[i], status: 'unavailable' }
  )
}
