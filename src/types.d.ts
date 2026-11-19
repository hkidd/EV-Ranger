export interface CarVariant {
  id: string
  modelYear?: number
  manufacturerTrim?: string
  manufacturerSourceUrl?: string
  manufacturerVerifiedAt?: string
  usAvailability?: 'available' | 'announced' | 'discontinued' | 'unverified'
  epaVehicleId?: string
  sourceUrl?: string
  rangeCityMiles?: number
  rangeHighwayMiles?: number
  efficiencyKwhPer100Miles?: number
  wheels?: string[]
  battery_size?: string[]
  name: string
  price?: number
  range: number
}

export interface Car {
  id: string
  brand: string
  model: string
  modelYear?: number
  variants: CarVariant[]
}
