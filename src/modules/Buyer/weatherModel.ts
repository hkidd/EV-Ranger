import type { RoadRoute, Place, Coordinate } from './types'
/** Three distance-based samples, independent of vehicle selection and manual assumptions. */
export function weatherCoordinates(
  route: RoadRoute | undefined,
  origin: Place | null
): Coordinate[] {
  if (!route) return origin ? [origin.coordinates] : []
  const points = route.geometry.coordinates
  const distances = route.segmentDistances
  if (distances) {
    let traveled = 0
    const half = distances.reduce((sum, d) => sum + d, 0) / 2
    for (let i = 0; i < distances.length; i++) {
      traveled += distances[i]
      if (traveled >= half)
        return [points[0], points[i + 1], points[points.length - 1]]
    }
  }
  const lengths = points.slice(1).map((point, i) => {
    const before = points[i],
      r = Math.PI / 180
    const h =
      Math.sin(((point[1] - before[1]) * r) / 2) ** 2 +
      Math.cos(point[1] * r) *
        Math.cos(before[1] * r) *
        Math.sin(((point[0] - before[0]) * r) / 2) ** 2
    return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)))
  })
  const total = lengths.reduce((sum, d) => sum + d, 0)
  let distance = 0,
    index = 0
  while (index < lengths.length - 1 && distance + lengths[index] < total / 2)
    distance += lengths[index++]
  const fraction = lengths[index] ? (total / 2 - distance) / lengths[index] : 0
  const midpoint: Coordinate = [
    points[index][0] + (points[index + 1][0] - points[index][0]) * fraction,
    points[index][1] + (points[index + 1][1] - points[index][1]) * fraction
  ]
  return [points[0], midpoint, points[points.length - 1]]
}
