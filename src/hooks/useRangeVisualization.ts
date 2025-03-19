import { useState, useRef, useCallback } from 'react'
import * as turf from '@turf/turf'

interface MapRef {
  current: mapboxgl.Map | null
}

interface RangeFeature {
  id: string
  source: string
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [legendItems, setLegendItems] = useState<LegendItem[]>([])
  const rangeFeatures = useRef<RangeFeature[]>([])

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

  // Create a circle feature with the given center and radius
  const createCircleFeature = useCallback(
    (center: [number, number], rangeMiles: number) => {
      return turf.circle(center, rangeMiles, {
        units: 'miles',
        steps: 64
      })
    },
    []
  )

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

  // Add a range circle overlay to the map with water exclusion
  const addRangeCircleWithWaterExclusion = useCallback(
    (
      center: [number, number],
      rangeMiles: number,
      carId: string,
      color: string
    ) => {
      if (!map.current) return false

      try {
        // Create IDs for sources and layers
        const circleSourceId = `range-circle-${carId}`
        const circleLayerId = `range-layer-${carId}`
        const circleBorderId = `range-border-${carId}`

        // First remove any existing layers/sources for this car ID
        if (map.current.getLayer(circleLayerId))
          map.current.removeLayer(circleLayerId)
        if (map.current.getLayer(circleBorderId))
          map.current.removeLayer(circleBorderId)
        if (map.current.getSource(circleSourceId))
          map.current.removeSource(circleSourceId)

        // Choose fill and border colors based on theme
        const fillColor = color
        const borderColor = isDarkMode
          ? colorModifier(color, 30)
          : colorModifier(color, -30)

        // Create circle GeoJSON
        const circleFeature = createCircleFeature(center, rangeMiles)

        // Add circle source
        map.current.addSource(circleSourceId, {
          type: 'geojson',
          data: circleFeature
        })

        // Add circle fill layer with compositing operation
        map.current.addLayer(
          {
            id: circleLayerId,
            type: 'fill',
            source: circleSourceId,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.4,
                0.3
              ],
              'fill-translate': [0, 0],
              'fill-antialias': true
            },
            layout: {
              visibility: 'visible'
            }
          },
          'water'
        ) // Place the circle layer below the water layer

        // Add circle border layer, also below water
        map.current.addLayer(
          {
            id: circleBorderId,
            type: 'line',
            source: circleSourceId,
            paint: {
              'line-color': borderColor,
              'line-width': 1.5,
              'line-opacity': 0.8
            }
          },
          'water'
        ) // Place the border layer below the water layer too

        // Track all layers and sources for cleanup
        rangeFeatures.current.push(
          { id: circleLayerId, source: circleSourceId },
          { id: circleBorderId, source: circleSourceId }
        )

        return true
      } catch (error) {
        console.error('Error adding range circle with water exclusion:', error)
        setError('Failed to visualize range. Please try again.')
        return false
      }
    },
    [map, createCircleFeature, isDarkMode, colorModifier]
  )

  // Clear all range visualizations from the map
  const clearRanges = useCallback(() => {
    if (!map.current) return

    try {
      // First remove all layers, then remove all sources
      // This is important because layers depend on sources, so we must remove layers first

      // Remove all layers
      rangeFeatures.current.forEach(({ id }) => {
        if (map.current?.getLayer(id)) {
          try {
            map.current.removeLayer(id)
          } catch (error) {
            console.warn(`Failed to remove layer ${id}:`, error)
          }
        }
      })

      // Now remove all sources
      const uniqueSources = new Set(
        rangeFeatures.current
          .filter(({ source }) => source !== 'composite') // Don't remove the Mapbox composite source
          .map(({ source }) => source)
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

      setIsUpdating(true)
      clearRanges()

      // If no cars, nothing to do
      if (selectedCars.length === 0) {
        setIsUpdating(false)
        return
      }

      // Add a small delay to batch updates and prevent too frequent re-renders when multiple parameters change
      setTimeout(
        () => {
          try {
            // Process all cars at once, creating client-side geometry
            selectedCars.forEach((car) => {
              // Calculate adjusted range
              const baseRange = car.range || 250 // fallback to 250 if missing
              const fractionEffect = car.sliderFraction || 1
              const tempEffect = externalTempAdjustment ? tempModifier : 1
              const adjustedRange = baseRange * fractionEffect * tempEffect

              // Create the range circle with water exclusion
              addRangeCircleWithWaterExclusion(
                correctedPosition,
                adjustedRange,
                car.carId,
                car.color || '#3B82F6' // default blue if missing
              )
            })

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
          } catch (error) {
            console.error('Error creating range visualization:', error)
            setError('Failed to create range visualization. Please try again.')
          } finally {
            setIsUpdating(false)
          }
        },
        onlyTempChanged ? 16 : 100 // Shorter delay for temperature changes, longer for position/car changes
      )
    },
    [map, clearRanges, isValidCoordinate, addRangeCircleWithWaterExclusion]
  )

  return {
    isLoadingRange: isUpdating,
    error,
    legendItems,
    clearRanges,
    updateRanges
  }
}
