import type { Car, CarVariant } from '../../types'
export type Coordinate = [number, number]
export interface Place {
  id: string
  label: string
  coordinates: Coordinate
}
export interface ElevationProfile {
  status: 'available' | 'partial' | 'unavailable'
  source: string
  sampleSpacingMeters: number
  samples: { distanceMeters: number; elevationMeters: number | null }[]
  ascentMeters: number | null
  descentMeters: number | null
}
export interface RoadRoute {
  elevation?: ElevationProfile
  geometry: { type: 'LineString'; coordinates: Coordinate[] }
  distance: number
  duration: number
  segmentDistances: number[] | null
  roundTrip: boolean
}
export interface LifeTrip {
  id: string
  label: string
  place: Place
  roundTrip: boolean
  status: 'idle' | 'loading' | 'ready' | 'error'
  route: RoadRoute | null
  error?: string
}
export interface TerrainInputs {
  enabled: boolean
  massKg?: number
  usableBatteryKwh?: number
}
export interface VehicleOption {
  terrain?: TerrainInputs
  car: Car
  variant: CarVariant
}
export interface Scenario {
  charge: number
  reserve: number
  temperature: number
  basis: 'highway' | 'combined' | 'city'
}
export interface FitEstimate {
  routeMiles: number
  fullRange: number
  usableRange: number
  arrival: number
  margin: number
  status: 'reserve-met' | 'below-reserve' | 'needs-charge'
  usedHighway: boolean
  baselineArrival: number
  terrainChargeDifference: number
  terrainStatus: 'applied' | 'disabled' | 'missing-inputs' | 'missing-elevation'
}

export interface DiscoveryPlace extends Place {
  category: string
  address: string
  route?: RoadRoute
  error?: string
}
export interface MapViewport {
  west: number
  south: number
  east: number
  north: number
  zoom: number
}
export interface DiscoveryResult {
  selectedPlaceId?: string
  selectedPlace?: DiscoveryPlace
  truncated?: boolean
  loadingPlaces?: boolean
  loadingBoundaries?: boolean
  searchPartial?: boolean
  searchRateLimited?: boolean
  searchId: string
  originKey: string
  roundTrip: boolean
  places: DiscoveryPlace[]
  boundaries?: { vehicleId: string; key: string; geometry: GeoJSON.Polygon }[]
}
export interface WeatherSample {
  coordinates: Coordinate
  status: 'available' | 'unavailable'
  temperatureF?: number
  summary?: string
  wind?: string
  validFrom?: string
  validTo?: string
  updatedAt?: string | null
}
