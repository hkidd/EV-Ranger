import { useState, useRef, useCallback, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import { getRoute as getRouteFromApi } from '../api/mapbox'
import { Feature, Polygon, GeoJsonProperties } from 'geojson'

// Set the Mapbox token from environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Interface for a range point with direction and distance
interface RangePoint {
  direction: number
  point: [number, number]
  drivingDistance: number | null
  originalRange?: number // Added for caching and scaling
}

interface MapRef {
  current: mapboxgl.Map | null
}

interface RangeFeature {
  id: string
  source: string
}

interface RouteResponse {
  route: {
    geometry: {
      type: string
      coordinates: [number, number][]
    }
    distance: number
  }
  error?: string
}

interface Car {
  carId: string
  brand: string
  model: string
  variantName?: string
  range: number
  color?: string
  sliderFraction?: number
}

interface LegendItem {
  carId: string
  brand: string
  model: string
  variantName: string
  color: string
  range: number
}

export const useRangeVisualization = (map: MapRef, isDarkMode: boolean) => {
  const [isLoadingRange, setIsLoadingRange] = useState(false)
  const [legendItems, setLegendItems] = useState<LegendItem[]>([])
  const rangeFeatures = useRef<RangeFeature[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const rangePointsCache = useRef(new Map<string, RangePoint[]>())

  // Store previous update info for optimization
  const prevUpdateRef = useRef({
    position: null as string | null,
    cars: null as string | null
  })

  // Helper function to validate if a coordinate pair is valid
  const isValidCoordinate = useCallback((coord: [number, number]): boolean => {
    // Check if it's an array with exactly 2 elements
    if (!Array.isArray(coord) || coord.length !== 2) {
      console.warn('Coordinate is not an array with 2 elements:', coord)
      return false
    }

    // Check if both values are finite numbers
    if (
      !Number.isFinite(Number(coord[0])) ||
      !Number.isFinite(Number(coord[1]))
    ) {
      console.warn('Coordinate contains non-finite values:', coord)
      return false
    }

    // Check if values are properly formatted for lng,lat or lat,lng
    let lng, lat

    // Case 1: coord is already in [lng, lat] format
    if (Math.abs(Number(coord[0])) <= 180 && Math.abs(Number(coord[1])) <= 90) {
      lng = Number(coord[0])
      lat = Number(coord[1])
    }
    // Case 2: coord is in [lat, lng] format and needs to be swapped
    else if (
      Math.abs(Number(coord[0])) <= 90 &&
      Math.abs(Number(coord[1])) <= 180
    ) {
      lng = Number(coord[1])
      lat = Number(coord[0])
      // Modify the original array to correct the format for future use
      coord[0] = lng
      coord[1] = lat
    }
    // Case 3: values are out of range
    else {
      console.warn('Coordinate values out of range:', coord)
      return false
    }

    return true
  }, [])

  // Get driving route between two points using our API service
  const getRoute = useCallback(
    async (
      start: [number, number],
      end: [number, number]
    ): Promise<RouteResponse | null> => {
      try {
        // Create copies of coordinates to avoid modifying the originals
        const startCoord = [...start] as [number, number]
        const endCoord = [...end] as [number, number]

        // Check if we need to swap coordinates (if they're in [lat, lng] format)
        // If first value looks like latitude and second like longitude, swap them
        if (
          Math.abs(Number(start[0])) <= 90 &&
          Math.abs(Number(start[1])) <= 180
        ) {
          startCoord[0] = Number(start[1])
          startCoord[1] = Number(start[0])
        }

        if (Math.abs(Number(end[0])) <= 90 && Math.abs(Number(end[1])) <= 180) {
          endCoord[0] = Number(end[1])
          endCoord[1] = Number(end[0])
        }

        // Validate coordinates before making request
        if (!isValidCoordinate(startCoord) || !isValidCoordinate(endCoord)) {
          console.error('Invalid coordinates for route request', {
            start: startCoord,
            end: endCoord
          })
          return null
        }

        // Get route from our API service
        const response = await getRouteFromApi(startCoord, endCoord)
        if (!response || response.error) {
          console.error('Error getting route:', response?.error)
          return null
        }

        return response
      } catch (error) {
        console.error('Error getting route:', error)
        return null
      }
    },
    [isValidCoordinate]
  )

  // Calculate endpoint given a starting point, direction, and distance
  const calculateEndpoint = useCallback(
    (
      startPoint: [number, number],
      direction: number,
      distanceMiles: number
    ): [number, number] => {
      // Convert miles to kilometers for turf
      const distanceKm = distanceMiles * 1.60934

      // Use turf.destination to calculate the endpoint
      const destination = turf.destination(
        turf.point(startPoint),
        distanceKm,
        direction,
        { units: 'kilometers' }
      )

      // Extract coordinates
      return destination.geometry.coordinates as [number, number]
    },
    []
  )

  // Find a point approximately the target distance away from the origin in a given direction
  const findRangePointInDirection = useCallback(
    async (
      origin: [number, number],
      direction: number,
      targetRangeMiles: number
    ): Promise<RangePoint> => {
      try {
        // Start with a point at the target range (straight line)
        const initialPoint = calculateEndpoint(
          origin,
          direction,
          targetRangeMiles
        )

        // Get the route to this point
        const initialRoute = await getRoute(origin, initialPoint)

        // If we couldn't get a route, try a closer point
        if (!initialRoute) {
          const closerPoint = calculateEndpoint(
            origin,
            direction,
            targetRangeMiles * 0.7
          )
          const closerRoute = await getRoute(origin, closerPoint)

          if (!closerRoute) {
            return {
              direction,
              point: closerPoint,
              drivingDistance: null,
              originalRange: targetRangeMiles
            }
          }

          return {
            direction,
            point: closerPoint,
            drivingDistance: closerRoute.route.distance,
            originalRange: targetRangeMiles
          }
        }

        // Calculate the ratio between straight-line and driving distance
        const straightLineDistance = targetRangeMiles
        const drivingDistance = initialRoute.route.distance

        if (drivingDistance <= 0) {
          return {
            direction,
            point: calculateEndpoint(origin, direction, targetRangeMiles * 0.7),
            drivingDistance: null,
            originalRange: targetRangeMiles
          }
        }

        // Calculate the road/straight ratio factor
        const roadFactor = drivingDistance / straightLineDistance

        // If the road factor is too high (roads are much longer than straight line),
        // try a closer point
        if (roadFactor > 2) {
          const closerPoint = calculateEndpoint(
            origin,
            direction,
            targetRangeMiles * 0.7
          )
          const closerRoute = await getRoute(origin, closerPoint)

          if (!closerRoute) {
            return {
              direction,
              point: closerPoint,
              drivingDistance: null,
              originalRange: targetRangeMiles
            }
          }

          return {
            direction,
            point: closerPoint,
            drivingDistance: closerRoute.route.distance,
            originalRange: targetRangeMiles
          }
        }

        return {
          direction,
          point: initialPoint,
          drivingDistance: drivingDistance,
          originalRange: targetRangeMiles
        }
      } catch (error) {
        console.error(
          `Error finding range point in direction ${direction}°:`,
          error
        )

        // Return a fallback point
        return {
          direction,
          point: calculateEndpoint(origin, direction, targetRangeMiles * 0.7),
          drivingDistance: null,
          originalRange: targetRangeMiles
        }
      }
    },
    [calculateEndpoint, getRoute]
  )

  // Generate range boundary points in all directions
  const generateRangePoints = useCallback(
    async (
      center: [number, number],
      rangeMiles: number
    ): Promise<RangePoint[]> => {
      // Validate the center coordinate
      if (!isValidCoordinate(center)) {
        console.error('Invalid center coordinates:', center)
        return []
      }

      // Create a new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        // For simplicity and to avoid Mapbox 422 errors, let's use just 8 cardinal directions
        // This reduces the number of API calls and is more reliable
        const directions = [0, 45, 90, 135, 180, 225, 270, 315]

        // Find range points in all directions - but sequentially to avoid overwhelming the API
        const rangePoints = []

        // If we have ranges cached for the same position, try to reuse them
        const positionKey = `${center[0]},${center[1]}`
        const cachedPoints = rangePointsCache.current.get(positionKey)

        // If we have cached range points for this position, adapt them for the new range
        if (cachedPoints && cachedPoints.length > 0) {
          const scaleFactor =
            rangeMiles / (cachedPoints[0]?.originalRange || rangeMiles)

          // Scale all the cached points to the new range
          for (const cachedPoint of cachedPoints) {
            // Get vector from center to point
            const dx = cachedPoint.point[0] - center[0]
            const dy = cachedPoint.point[1] - center[1]

            // Scale the vector
            const scaledPoint: [number, number] = [
              center[0] + dx * scaleFactor,
              center[1] + dy * scaleFactor
            ]

            rangePoints.push({
              direction: cachedPoint.direction,
              point: scaledPoint,
              drivingDistance: cachedPoint.drivingDistance
                ? cachedPoint.drivingDistance * scaleFactor
                : null,
              originalRange: rangeMiles
            })
          }

          return rangePoints
        }

        // No cached points, generate new ones
        for (const direction of directions) {
          // Check if we've been aborted
          if (abortController.signal.aborted) {
            return []
          }

          try {
            const point = await findRangePointInDirection(
              center,
              direction,
              rangeMiles
            )

            // Store the original range for future scaling
            point.originalRange = rangeMiles

            rangePoints.push(point)
          } catch (directionError) {
            console.error(`Error for direction ${direction}°:`, directionError)
            // Add a fallback point for this direction so we still have something
            rangePoints.push({
              direction,
              point: calculateEndpoint(center, direction, rangeMiles * 0.7),
              drivingDistance: null,
              originalRange: rangeMiles
            })
          }

          // Add a small delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Cache the points for future use
        if (rangePoints.length > 0) {
          rangePointsCache.current.set(positionKey, rangePoints)
        }

        // Clear the abort controller if this is still the current operation
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }

        return rangePoints
      } catch (error) {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return []
        }

        console.error('Error generating range points:', error)
        return []
      }
    },
    [findRangePointInDirection, calculateEndpoint, isValidCoordinate]
  )

  // Create a polygon from range points
  const createRangePolygon = useCallback((rangePoints: RangePoint[]) => {
    if (rangePoints.length < 3) {
      console.warn('Not enough points to create a polygon')
      return null
    }

    // Create a closed polygon by sorting the points by direction
    const sortedPoints = [...rangePoints].sort(
      (a, b) => a.direction - b.direction
    )

    // Create a GeoJSON polygon
    const coordinates = sortedPoints.map((rp) => rp.point)

    // Close the polygon by adding the first point at the end
    coordinates.push(coordinates[0])

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {}
    } as Feature<Polygon, GeoJsonProperties>
  }, [])

  // Fall back to a circle if the polygon creation fails
  const createFallbackCircle = useCallback(
    (center: [number, number], rangeMiles: number) => {
      return turf.circle(center, rangeMiles * 0.8, {
        units: 'miles',
        steps: 64
      })
    },
    []
  )

  // Utility function to lighten a color
  const lightenColor = useCallback((hex: string, amount: number) => {
    return colorModifier(hex, amount)
  }, [])

  // Utility function to darken a color
  const darkenColor = useCallback((hex: string, amount: number) => {
    return colorModifier(hex, -amount)
  }, [])

  // Helper function to modify colors
  const colorModifier = useCallback((hex: string, amount: number) => {
    hex = hex.replace('#', '')

    const num = parseInt(hex, 16)
    let r = (num >> 16) + amount
    let g = ((num >> 8) & 0x00ff) + amount
    let b = (num & 0x0000ff) + amount

    r = Math.min(Math.max(r, 0), 255)
    g = Math.min(Math.max(g, 0), 255)
    b = Math.min(Math.max(b, 0), 255)

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }, [])

  // Add a range visualization to the map
  const addRangeToMap = useCallback(
    (
      geoJson: Feature<Polygon, GeoJsonProperties>,
      carId: string,
      color: string
    ) => {
      if (!map.current || !geoJson) return false

      try {
        // Create IDs for the source and layers
        const sourceId = `range-source-${carId}`
        const layerId = `range-layer-${carId}`
        const borderLayerId = `range-border-${carId}`

        // First remove any existing layers/sources for this car ID to prevent errors
        // This is a safety precaution in case clearRanges wasn't fully successful
        try {
          if (map.current.getLayer(layerId)) map.current.removeLayer(layerId)
          if (map.current.getLayer(borderLayerId))
            map.current.removeLayer(borderLayerId)
          if (map.current.getSource(sourceId))
            map.current.removeSource(sourceId)
        } catch (error) {
          console.warn(
            `Error removing existing layers/source for ${carId}:`,
            error
          )
        }

        // Choose fill and border colors based on theme
        const fillColor = color
        const borderColor = isDarkMode
          ? lightenColor(color, 30)
          : darkenColor(color, 30)

        // Add source
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: geoJson
        })

        // Add fill layer
        map.current.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': fillColor,
            'fill-opacity': 0.3,
            'fill-outline-color': borderColor
          }
        })

        // Add border layer
        map.current.addLayer({
          id: borderLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': borderColor,
            'line-width': 2,
            'line-opacity': 0.8
          }
        })

        // Track for cleanup
        rangeFeatures.current.push(
          { id: layerId, source: sourceId },
          { id: borderLayerId, source: sourceId }
        )

        return true
      } catch (error) {
        console.error('Error adding range to map:', error)
        return false
      }
    },
    [map, isDarkMode, lightenColor, darkenColor]
  )

  // Create a range visualization for a single car
  const createRangeVisualization = useCallback(
    async (
      center: [number, number],
      rangeMiles: number,
      carId: string,
      color: string,
      callback: () => void
    ) => {
      try {
        // Generate range points
        const rangePoints = await generateRangePoints(center, rangeMiles)

        // Create polygon from range points
        let geoJson = createRangePolygon(rangePoints)

        // Fall back to circle if polygon creation fails
        if (!geoJson) {
          console.warn('Falling back to circle visualization')
          geoJson = createFallbackCircle(center, rangeMiles)
        }

        // Add to map
        addRangeToMap(geoJson, carId, color)

        // Done
        callback()
      } catch (error) {
        console.error('Error creating range visualization:', error)

        // Try fallback
        try {
          const fallback = createFallbackCircle(center, rangeMiles)
          addRangeToMap(fallback, carId, color)
        } catch (fallbackError) {
          console.error('Fallback visualization failed:', fallbackError)
        }

        callback()
      }
    },
    [
      generateRangePoints,
      createRangePolygon,
      createFallbackCircle,
      addRangeToMap
    ]
  )

  // Clear all range visualizations from the map
  const clearRanges = useCallback(() => {
    if (!map.current) return

    // Abort any ongoing range calculations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    try {
      // First remove all layers, then remove all sources
      // This is important because layers depend on sources, so we must remove layers first

      // Step 1: Remove all layers
      rangeFeatures.current.forEach(({ id }) => {
        if (map.current?.getLayer(id)) {
          try {
            map.current.removeLayer(id)
          } catch (error) {
            console.warn(`Failed to remove layer ${id}:`, error)
          }
        }
      })

      // Step 2: Now remove all sources
      const uniqueSources = new Set(
        rangeFeatures.current.map(({ source }) => source)
      )
      uniqueSources.forEach((source) => {
        if (map.current?.getSource(source)) {
          try {
            map.current.removeSource(source)
          } catch (error) {
            console.warn(`Failed to remove source ${source}:`, error)
          }
        }
      })
    } catch (error) {
      console.error('Error clearing ranges:', error)
    }

    // Clear our tracking array
    rangeFeatures.current = []
    setLegendItems([])
  }, [map])

  // Update ranges for all selected cars
  const updateRanges = useCallback(
    (
      selectedCars: Car[],
      markerPosition: [number, number],
      externalTempAdjustment: boolean,
      tempModifier: number
    ) => {
      if (!map.current) {
        console.error('Map not available for updateRanges')
        return
      }

      // Check if we need to swap the coordinates (if they're in [lat, lng] format)
      let correctedPosition: [number, number] = [...markerPosition]

      // If first value looks like latitude and second like longitude, swap them
      if (
        Math.abs(Number(markerPosition[0])) <= 90 &&
        Math.abs(Number(markerPosition[1])) <= 180
      ) {
        correctedPosition = [
          Number(markerPosition[1]),
          Number(markerPosition[0])
        ]
      }

      if (!isValidCoordinate(correctedPosition)) {
        console.error(
          'Invalid marker position for range update:',
          correctedPosition
        )
        return
      }

      // Keep track of what we're updating to avoid unnecessary API calls
      const positionKey = `${correctedPosition[0]},${correctedPosition[1]}`
      const carsKey = selectedCars.map((c) => c.carId).join(',')

      // Check if only temperature changed
      const onlyTempChanged =
        prevUpdateRef.current.position === positionKey &&
        prevUpdateRef.current.cars === carsKey

      // Update our ref for next time
      prevUpdateRef.current = {
        position: positionKey,
        cars: carsKey
      }

      setIsLoadingRange(true)
      clearRanges()

      // If no cars, nothing to do
      if (selectedCars.length === 0) {
        setIsLoadingRange(false)
        return
      }

      // Add a small delay before making API requests
      // This helps prevent rate limiting if the user is rapidly changing temperature
      setTimeout(
        () => {
          // Process cars sequentially rather than in parallel
          // This avoids overwhelming the API with too many requests at once
          const processNextCar = (index = 0) => {
            if (index >= selectedCars.length) {
              setIsLoadingRange(false)
              return
            }

            const car = selectedCars[index]

            // Calculate adjusted range
            const baseRange = car.range || 250 // fallback to 250 if missing
            const fractionEffect = car.sliderFraction || 1
            const tempEffect = externalTempAdjustment ? tempModifier : 1
            const adjustedRange = baseRange * fractionEffect * tempEffect

            createRangeVisualization(
              correctedPosition,
              adjustedRange,
              car.carId,
              car.color || '#3B82F6', // default blue if missing
              () => {
                // Process the next car when this one is done
                processNextCar(index + 1)
              }
            )
          }

          // Start processing the first car
          processNextCar()

          // Update legend items
          setLegendItems(
            selectedCars.map((car) => ({
              carId: car.carId,
              brand: car.brand,
              model: car.model,
              variantName: car.variantName || `Car ${car.carId}`,
              color: car.color || '#3B82F6',
              range: car.range || 250
            }))
          )
        },
        onlyTempChanged ? 50 : 250
      ) // Shorter delay if only temp changed
    },
    [map, createRangeVisualization, clearRanges, isValidCoordinate]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    isLoadingRange,
    legendItems,
    clearRanges,
    updateRanges
  }
}
