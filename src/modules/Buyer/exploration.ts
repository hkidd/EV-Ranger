import type { Coordinate, MapViewport } from './types'
export const INTERESTS = [
  { id: 'parks', label: 'Parks & outdoors', color: '#398261' },
  { id: 'attractions', label: 'Attractions', color: '#be7d42' },
  { id: 'museums', label: 'Museums', color: '#8870b5' },
  { id: 'camping', label: 'Camping', color: '#408da2' }
]
const unwrap = (lon: number, around: number) =>
  around + ((((lon - around) % 360) + 540) % 360) - 180
/** Test all rings, including holes, without stretching a date-line polygon across the world. */
export function inReach(point: Coordinate, polygon: GeoJSON.Polygon) {
  const insideRing = (ring: number[][]) => {
    let inside = false
    const anchor = ring[0][0],
      x = unwrap(point[0], anchor)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = unwrap(ring[i][0], anchor),
        yi = ring[i][1]
      const xj = unwrap(ring[j][0], anchor),
        yj = ring[j][1]
      const cross = (x - xi) * (yj - yi) - (point[1] - yi) * (xj - xi)
      if (
        Math.abs(cross) < 1e-8 &&
        x >= Math.min(xi, xj) &&
        x <= Math.max(xi, xj) &&
        point[1] >= Math.min(yi, yj) &&
        point[1] <= Math.max(yi, yj)
      )
        return true
      if (
        yi > point[1] !== yj > point[1] &&
        x < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
      )
        inside = !inside
    }
    return inside
  }
  return (
    insideRing(polygon.coordinates[0]) &&
    !polygon.coordinates.slice(1).some(insideRing)
  )
}
/** Keep retained POIs inside the latest viewport, including date-line views. */
export function inExplorationBounds(
  point: Coordinate,
  bounds: [number, number, number, number]
) {
  const longitude = unwrap(point[0], (bounds[0] + bounds[2]) / 2)
  return (
    longitude >= bounds[0] &&
    longitude <= bounds[2] &&
    point[1] >= bounds[1] &&
    point[1] <= bounds[3]
  )
}
/** Limit provider work to the visible intersection of the estimated reach areas. */
export function explorationBounds(
  viewport: MapViewport | null,
  polygons: GeoJSON.Polygon[],
  origin: Coordinate
): [number, number, number, number] | null {
  if (!viewport || !polygons.length) return null
  const points = polygons
    .flatMap((p) => p.coordinates[0])
    .map((p) => [unwrap(p[0], origin[0]), p[1]])
  const width = Math.min(360, viewport.east - viewport.west)
  const west =
    unwrap((viewport.west + viewport.east) / 2, origin[0]) - width / 2
  const bounds: [number, number, number, number] = [
    Math.max(west, Math.min(...points.map((p) => p[0]))),
    Math.max(-85, viewport.south, Math.min(...points.map((p) => p[1]))),
    Math.min(west + width, Math.max(...points.map((p) => p[0]))),
    Math.min(85, viewport.north, Math.max(...points.map((p) => p[1])))
  ]
  return bounds[0] < bounds[2] &&
    bounds[1] < bounds[3] &&
    bounds[2] - bounds[0] <= 60 &&
    bounds[3] - bounds[1] <= 30
    ? (bounds.map((v) => Math.round(v * 10000) / 10000) as typeof bounds)
    : null
}
