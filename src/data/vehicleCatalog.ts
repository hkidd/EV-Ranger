import type { Car, CarVariant } from '../types'

export interface VehicleCatalog {
  cars: Car[]
  importedAt: string
  source: string
  configurationCount: number
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid vehicle catalog record')
  }
  return value as Record<string, unknown>
}
const optionalPositive = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined

/** Adapt the versioned EPA snapshot without inventing retail trims or specifications. */
export function parseVehicleCatalog(value: unknown): VehicleCatalog {
  const dataset = object(value)
  if (
    dataset.schemaVersion !== 1 ||
    !Array.isArray(dataset.vehicles) ||
    !dataset.vehicles.length ||
    typeof dataset.importedAt !== 'string' ||
    !Number.isFinite(Date.parse(dataset.importedAt)) ||
    dataset.source !== 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv'
  ) {
    throw new Error('Unsupported or incomplete vehicle catalog')
  }
  const groups = new Map<string, Car>()
  const ids = new Set<string>()
  for (const value of dataset.vehicles) {
    const record = object(value),
      range = object(record.rangeMiles)
    if (
      typeof record.epaVehicleId !== 'string' ||
      !/^\d+$/.test(record.epaVehicleId) ||
      ids.has(record.epaVehicleId) ||
      typeof record.modelYear !== 'number' ||
      !Number.isInteger(record.modelYear) ||
      record.modelYear < 2000 ||
      typeof record.make !== 'string' ||
      !record.make.trim() ||
      typeof record.model !== 'string' ||
      !record.model.trim() ||
      optionalPositive(range.combined) === undefined
    ) {
      throw new Error('Invalid or duplicate EPA configuration')
    }
    ids.add(record.epaVehicleId)
    const key = JSON.stringify([record.modelYear, record.make, record.model])
    let car = groups.get(key)
    if (!car) {
      car = {
        id: key,
        brand: record.make,
        model: record.model,
        modelYear: record.modelYear,
        variants: []
      }
      groups.set(key, car)
    }
    const efficiency = record.efficiencyKwhPer100Miles
      ? object(record.efficiencyKwhPer100Miles)
      : {}
    const verified =
      typeof record.manufacturerSourceUrl === 'string' &&
      record.manufacturerSourceUrl.startsWith('https://') &&
      typeof record.manufacturerVerifiedAt === 'string' &&
      Number.isFinite(Date.parse(record.manufacturerVerifiedAt))
    const trim =
      verified &&
      typeof record.manufacturerTrim === 'string' &&
      record.manufacturerTrim.trim()
        ? record.manufacturerTrim
        : undefined
    const battery = verified ? optionalPositive(record.batteryKwh) : undefined
    const wheel = verified ? optionalPositive(record.wheelInches) : undefined
    const variant: CarVariant = {
      id: `epa-${record.epaVehicleId}`,
      name:
        trim ||
        (typeof record.drivetrain === 'string' && record.drivetrain
          ? record.drivetrain
          : 'EPA configuration'),
      range: range.combined as number,
      modelYear: record.modelYear,
      manufacturerTrim: trim,
      manufacturerSourceUrl: verified
        ? (record.manufacturerSourceUrl as string)
        : undefined,
      manufacturerVerifiedAt: verified
        ? (record.manufacturerVerifiedAt as string)
        : undefined,
      usAvailability:
        verified &&
        ['available', 'announced', 'discontinued'].includes(
          String(record.usAvailability)
        )
          ? (record.usAvailability as
              | 'available'
              | 'announced'
              | 'discontinued')
          : 'unverified',
      price: verified ? optionalPositive(record.startingMsrpUsd) : undefined,
      epaVehicleId: record.epaVehicleId,
      sourceUrl: `https://www.fueleconomy.gov/ws/rest/vehicle/${record.epaVehicleId}`,
      rangeCityMiles: optionalPositive(range.city),
      rangeHighwayMiles: optionalPositive(range.highway),
      efficiencyKwhPer100Miles: optionalPositive(efficiency.combined),
      battery_size: battery === undefined ? [] : [`${battery} kWh`],
      wheels: wheel === undefined ? [] : [`${wheel} inch`]
    }
    car.variants.push(variant)
  }
  const cars = [...groups.values()].sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      a.model.localeCompare(b.model) ||
      (b.modelYear ?? 0) - (a.modelYear ?? 0)
  )
  return {
    cars,
    importedAt: dataset.importedAt,
    source: dataset.source,
    configurationCount: ids.size
  }
}
