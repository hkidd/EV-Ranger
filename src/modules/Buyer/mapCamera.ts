import type { LifeTrip, Place } from './types'

/** Only navigation changes should refit a trip; optional enrichment is not navigation. */
export function tripCameraFrame(
  origin: Place | null,
  trips: LifeTrip[],
  activeTrip: LifeTrip | undefined
) {
  return JSON.stringify({
    selectedTrip: activeTrip?.id ?? null,
    coordinates: activeTrip?.route?.geometry.coordinates ?? [
      ...(origin ? [origin.coordinates] : []),
      ...trips.map((trip) => trip.place.coordinates)
    ]
  })
}
