import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseVehicleCatalog } from '../data/vehicleCatalog'

interface CatalogManifest {
  schemaVersion: 1
  source: string
  importedAt: string
  defaultYears: number[]
  years: { year: number; count: number; file: string }[]
  idYears: Record<string, number>
}
const base = (
  import.meta.env.VITE_VEHICLE_CATALOG_BASE_URL ||
  (import.meta.env.DEV ? '/api/catalog/' : `${import.meta.env.BASE_URL}data/`)
).replace(/\/?$/, '/')
function parseManifest(value: unknown): CatalogManifest {
  const item = value as CatalogManifest
  if (
    !item ||
    item.schemaVersion !== 1 ||
    !Number.isFinite(Date.parse(item.importedAt)) ||
    item.source !== 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv' ||
    !Array.isArray(item.years) ||
    !item.years.length ||
    !item.years.every(
      (entry) =>
        Number.isInteger(entry.year) &&
        entry.year >= 2000 &&
        Number.isInteger(entry.count) &&
        entry.count > 0 &&
        /^catalog\/\d{4}-[a-f0-9]+\.json$/.test(entry.file)
    ) ||
    !Array.isArray(item.defaultYears) ||
    !item.defaultYears.length ||
    !item.defaultYears.every((year) =>
      item.years.some((entry) => entry.year === year)
    ) ||
    !item.idYears ||
    typeof item.idYears !== 'object' ||
    Array.isArray(item.idYears)
  )
    throw new Error('Invalid vehicle archive index')
  return item
}
export const useCarsQuery = (year = 'recent', shortlist: string[] = []) => {
  const client = useQueryClient()
  const manifest = useQuery({
    queryKey: ['vehicle-catalog-manifest', 1],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${base}catalog-manifest.json`, {
        signal,
        cache: 'no-cache'
      })
      if (!response.ok)
        throw new Error('Unable to load the vehicle archive index')
      return parseManifest(await response.json())
    },
    staleTime: 3600000
  })
  const index = manifest.data
  const requestedYears = index
    ? year === 'all'
      ? index.years.map((entry) => entry.year)
      : year === 'recent'
        ? index.defaultYears
        : [Number(year)]
    : []
  const neededYears = [
    ...new Set([
      ...requestedYears,
      ...shortlist
        .map((id) => index?.idYears[id])
        .filter((value): value is number => typeof value === 'number')
    ])
  ].sort((a, b) => b - a)
  const catalog = useQuery({
    queryKey: ['vehicle-catalog-shards', index?.importedAt, ...neededYears],
    enabled: Boolean(index),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!index) throw new Error('Archive index is unavailable')
      const parts = await Promise.all(
        neededYears.map(async (year) => {
          const entry = index.years.find((item) => item.year === year)
          if (!entry) throw new Error('The requested model year is unavailable')
          return client.fetchQuery({
            queryKey: ['vehicle-catalog-file', entry.file],
            queryFn: async ({ signal }) => {
              const response = await fetch(`${base}${entry.file}`, { signal })
              if (!response.ok)
                throw new Error(`Unable to load ${year} vehicles`)
              return parseVehicleCatalog(await response.json())
            },
            staleTime: Infinity
          })
        })
      )
      return {
        cars: parts.flatMap((part) => part.cars),
        configurationCount: parts.reduce(
          (sum, part) => sum + part.configurationCount,
          0
        ),
        importedAt: index.importedAt,
        source: index.source
      }
    },
    staleTime: 3600000
  })
  return {
    ...catalog,
    isLoading: manifest.isPending || catalog.isPending,
    isError: manifest.isError || catalog.isError,
    availableYears: index?.years.map((entry) => entry.year) ?? [],
    recentYears: index?.defaultYears ?? [],
    refetch: async () => {
      await manifest.refetch()
      return catalog.refetch()
    }
  }
}
