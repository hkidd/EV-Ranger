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

interface RoadAwareOptions {
    enabled: boolean
    fallbackToCircle: boolean
    cacheTimeout: number // minutes
}

export const useRangeVisualization = (
    map: MapRef,
    isDarkMode: boolean,
    roadAwareOptions: RoadAwareOptions = {
        enabled: true,
        fallbackToCircle: true,
        cacheTimeout: 30
    }
) => {
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
    const isValidCoordinate = useCallback(
        (coord: [number, number]): boolean => {
            if (!Array.isArray(coord) || coord.length !== 2) {
                console.warn(
                    'Coordinate is not an array with 2 elements:',
                    coord
                )
                return false
            }

            if (
                !Number.isFinite(Number(coord[0])) ||
                !Number.isFinite(Number(coord[1]))
            ) {
                console.warn('Coordinate contains non-finite values:', coord)
                return false
            }

            let lng, lat

            if (
                Math.abs(Number(coord[0])) <= 180 &&
                Math.abs(Number(coord[1])) <= 90
            ) {
                lng = Number(coord[0])
                lat = Number(coord[1])
            } else if (
                Math.abs(Number(coord[0])) <= 90 &&
                Math.abs(Number(coord[1])) <= 180
            ) {
                lng = Number(coord[1])
                lat = Number(coord[0])
                coord[0] = lng
                coord[1] = lat
            } else {
                console.warn('Coordinate values out of range:', coord)
                return false
            }

            return true
        },
        []
    )

    // Create a circle feature with the given center and radius (fallback method)
    const createCircleFeature = useCallback(
        (center: [number, number], rangeMiles: number) => {
            return turf.circle(center, rangeMiles, {
                units: 'miles',
                steps: 64
            })
        },
        []
    )

    // NEW: Create a road-aware polygon feature using algorithmic approach
    const createRoadAwareFeature = useCallback(
        async (
            center: [number, number],
            rangeMiles: number
        ): Promise<GeoJSON.Feature<GeoJSON.Polygon>> => {
            if (!roadAwareOptions.enabled) {
                return createCircleFeature(center, rangeMiles)
            }

            try {
                // Use algorithmic approach instead of API calls
                const algorithmicShape = createAlgorithmicRangeShape(
                    center,
                    rangeMiles
                )

                return algorithmicShape
            } catch (error) {
                console.warn(
                    'Algorithmic road-aware calculation failed, falling back to circle:',
                    error
                )
                if (roadAwareOptions.fallbackToCircle) {
                    return createCircleFeature(center, rangeMiles)
                }
                throw error
            }
        },
        [
            roadAwareOptions.enabled,
            roadAwareOptions.fallbackToCircle,
            createCircleFeature
        ]
    )

    // NEW: Create realistic range shape using geographic algorithms
    const createAlgorithmicRangeShape = useCallback(
        (
            center: [number, number],
            baseRangeMiles: number
        ): GeoJSON.Feature<GeoJSON.Polygon> => {
            const [lng, lat] = center

            // Determine geographic context
            let roadPattern = {
                primaryDirection: 90, // East-West default
                secondaryDirection: 0, // North-South default
                coastalInfluence: 0.2,
                mountainInfluence: 0.3,
                urbanDensity: 0.5
            }

            let knownBarriers: Array<{ direction: number; severity: number }> =
                []

            // Texas - major east-west highways (I-10, I-20, I-30)
            if (lng >= -106 && lng <= -93 && lat >= 25 && lat <= 37) {
                roadPattern = {
                    primaryDirection: 90, // East-West (I-10, I-20)
                    secondaryDirection: 0, // North-South (I-35, I-45)
                    coastalInfluence: 0.3,
                    mountainInfluence: 0.1,
                    urbanDensity: 0.6
                }
                knownBarriers = [
                    { direction: 180, severity: 0.6 }, // Gulf influence
                    { direction: 225, severity: 0.3 } // Mexico border
                ]
            }

            // California - major north-south corridors
            else if (lng >= -125 && lng <= -114 && lat >= 32 && lat <= 42) {
                roadPattern = {
                    primaryDirection: 0, // North-South (I-5, US-101)
                    secondaryDirection: 90, // East-West (I-10, I-80)
                    coastalInfluence: 0.8,
                    mountainInfluence: 0.7,
                    urbanDensity: 0.8
                }
                knownBarriers = [
                    { direction: 270, severity: 0.8 }, // Pacific Ocean
                    { direction: 90, severity: 0.6 } // Sierra Nevada
                ]
            }

            // Florida - constrained by water
            else if (lng >= -87 && lng <= -80 && lat >= 24 && lat <= 31) {
                roadPattern = {
                    primaryDirection: 0, // North-South (I-95, I-75)
                    secondaryDirection: 90, // East-West (I-4, I-10)
                    coastalInfluence: 0.9,
                    mountainInfluence: 0.0,
                    urbanDensity: 0.7
                }
                knownBarriers = [
                    { direction: 90, severity: 0.9 }, // Atlantic
                    { direction: 270, severity: 0.8 } // Gulf
                ]
            }

            const sampleCount = 24 // Good balance of smoothness and performance
            const coordinates: number[][] = []

            for (let i = 0; i < sampleCount; i++) {
                const bearing = (360 / sampleCount) * i
                let rangeMultiplier = 1.0

                // Highway corridor effects
                const primaryAlignment = getAlignment(
                    bearing,
                    roadPattern.primaryDirection
                )
                const secondaryAlignment = getAlignment(
                    bearing,
                    roadPattern.secondaryDirection
                )

                // Boost range along major highway corridors
                const highwayBoost =
                    Math.max(primaryAlignment, secondaryAlignment * 0.7) * 0.25
                rangeMultiplier += highwayBoost

                // Geographic barrier effects
                knownBarriers.forEach((barrier) => {
                    const barrierAlignment = getAlignment(
                        bearing,
                        barrier.direction
                    )
                    const barrierPenalty =
                        barrierAlignment * barrier.severity * 0.35
                    rangeMultiplier -= barrierPenalty
                })

                // Coastal and mountain influences
                if (roadPattern.coastalInfluence > 0.5) {
                    rangeMultiplier -= roadPattern.coastalInfluence * 0.1
                }

                if (roadPattern.mountainInfluence > 0.5) {
                    rangeMultiplier -= roadPattern.mountainInfluence * 0.15
                }

                // Urban density boost
                rangeMultiplier += roadPattern.urbanDensity * 0.08

                // Add subtle randomness for organic appearance
                const randomVariation = (Math.random() - 0.5) * 0.08
                rangeMultiplier += randomVariation

                // Clamp to reasonable bounds
                rangeMultiplier = Math.max(0.5, Math.min(1.4, rangeMultiplier))

                const adjustedRange = baseRangeMiles * rangeMultiplier

                const point = turf.destination(
                    turf.point(center),
                    adjustedRange,
                    bearing,
                    { units: 'miles' }
                )

                coordinates.push(point.geometry.coordinates)
            }

            // Close the polygon
            coordinates.push(coordinates[0])

            // Light smoothing to avoid sharp corners
            const smoothedCoordinates = smoothPolygon(coordinates)

            return turf.polygon([smoothedCoordinates])
        },
        []
    )

    // Helper function to calculate alignment between two angles
    const getAlignment = (angle1: number, angle2: number): number => {
        const diff = Math.abs(((angle1 - angle2 + 180) % 360) - 180)
        return Math.max(0, 1 - diff / 90)
    }

    // Helper function to smooth polygon coordinates
    const smoothPolygon = (coordinates: number[][]): number[][] => {
        if (coordinates.length < 4) return coordinates

        const smoothed: number[][] = []

        for (let i = 0; i < coordinates.length - 1; i++) {
            const prev = coordinates[i === 0 ? coordinates.length - 2 : i - 1]
            const curr = coordinates[i]
            const next = coordinates[i + 1 === coordinates.length ? 1 : i + 1]

            // Simple smoothing: average with neighbors
            const smoothedLng = (prev[0] + curr[0] * 2 + next[0]) / 4
            const smoothedLat = (prev[1] + curr[1] * 2 + next[1]) / 4

            smoothed.push([smoothedLng, smoothedLat])
        }

        // Close the polygon
        smoothed.push(smoothed[0])

        return smoothed
    }

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

    // UPDATED: Add a range overlay to the map (now supports both circles and algorithmic shapes)
    const addRangeOverlay = useCallback(
        async (
            center: [number, number],
            rangeMiles: number,
            carId: string,
            color: string
        ) => {
            if (!map.current) return false

            try {
                const sourceId = `range-${carId}`
                const layerId = `range-layer-${carId}`
                const borderId = `range-border-${carId}`

                // Remove existing layers/sources
                if (map.current.getLayer(layerId))
                    map.current.removeLayer(layerId)
                if (map.current.getLayer(borderId))
                    map.current.removeLayer(borderId)
                if (map.current.getSource(sourceId))
                    map.current.removeSource(sourceId)

                // Create feature (either circle or algorithmic shape)
                const feature = await createRoadAwareFeature(center, rangeMiles)

                const fillColor = color
                const borderColor = isDarkMode
                    ? colorModifier(color, 30)
                    : colorModifier(color, -30)

                // Add source
                map.current.addSource(sourceId, {
                    type: 'geojson',
                    data: feature
                })

                // Add fill layer
                map.current.addLayer(
                    {
                        id: layerId,
                        type: 'fill',
                        source: sourceId,
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
                        }
                    },
                    'water'
                )

                // Add border layer
                map.current.addLayer(
                    {
                        id: borderId,
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': borderColor,
                            'line-width': 1.5,
                            'line-opacity': 0.8
                        }
                    },
                    'water'
                )

                rangeFeatures.current.push(
                    { id: layerId, source: sourceId },
                    { id: borderId, source: sourceId }
                )

                return true
            } catch (error) {
                console.error('Error adding range overlay:', error)
                setError('Failed to visualize range. Please try again.')
                return false
            }
        },
        [map, createRoadAwareFeature, isDarkMode, colorModifier]
    )

    // Clear all range visualizations from the map
    const clearRanges = useCallback(() => {
        if (!map.current) return

        try {
            rangeFeatures.current.forEach(({ id }) => {
                if (map.current?.getLayer(id)) {
                    try {
                        map.current.removeLayer(id)
                    } catch (error) {
                        console.warn(`Failed to remove layer ${id}:`, error)
                    }
                }
            })

            const uniqueSources = new Set(
                rangeFeatures.current
                    .filter(({ source }) => source !== 'composite')
                    .map(({ source }) => source)
            )

            uniqueSources.forEach((source) => {
                if (map.current?.getSource(source)) {
                    try {
                        map.current.removeSource(source)
                    } catch (error) {
                        console.warn(
                            `Failed to remove source ${source}:`,
                            error
                        )
                    }
                }
            })
        } catch (error) {
            console.error('Error clearing ranges:', error)
        }

        rangeFeatures.current = []
        setLegendItems([])
    }, [map])

    // UPDATED: Update ranges for all selected cars (now uses algorithmic road-aware visualization)
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

            let correctedPosition: [number, number] = [...markerPosition]

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

            const positionKey = `${Math.round(correctedPosition[0] * 100000) / 100000},${Math.round(correctedPosition[1] * 100000) / 100000}`
            const carsKey = selectedCars
                .map(
                    (c) =>
                        `${c.carId}-${Math.round((c.range || 250) * 10) / 10}`
                )
                .join(',')

            // Check if only temperature changed
            const onlyTempChanged =
                prevUpdateRef.current.position === positionKey &&
                prevUpdateRef.current.cars === carsKey

            // Skip if already updating to prevent multiple simultaneous updates
            if (isUpdating) {
                return
            }

            prevUpdateRef.current = {
                position: positionKey,
                cars: carsKey
            }

            setIsUpdating(true)
            clearRanges()

            if (selectedCars.length === 0) {
                setIsUpdating(false)
                return
            }

            // Handle async operations properly with timeout
            const timeoutId = setTimeout(
                () => {
                    const processRanges = async () => {
                        try {
                            // Process all cars - no staggered delay needed for algorithmic approach
                            const promises = selectedCars.map(async (car) => {
                                const baseRange = car.range || 250
                                const fractionEffect = car.sliderFraction || 1
                                const tempEffect = externalTempAdjustment
                                    ? tempModifier
                                    : 1
                                const adjustedRange =
                                    baseRange * fractionEffect * tempEffect

                                return addRangeOverlay(
                                    correctedPosition,
                                    adjustedRange,
                                    car.carId,
                                    car.color || '#3B82F6'
                                )
                            })

                            await Promise.all(promises)

                            setLegendItems(
                                selectedCars.map((car) => ({
                                    carId: car.carId,
                                    brand: car.brand,
                                    model: car.model,
                                    variantName:
                                        car.variantName || `Car ${car.carId}`,
                                    color: car.color || '#3B82F6',
                                    range: car.range || 250
                                }))
                            )
                        } catch (error) {
                            console.error(
                                'Error creating range visualization:',
                                error
                            )
                            setError(
                                'Failed to create range visualization. Please try again.'
                            )
                        } finally {
                            setIsUpdating(false)
                        }
                    }

                    processRanges()
                },
                onlyTempChanged ? 16 : 100 // Standard delays since no API calls
            )

            // Cleanup function to prevent memory leaks
            return () => {
                clearTimeout(timeoutId)
                setIsUpdating(false)
            }
        },
        [map, clearRanges, isValidCoordinate, addRangeOverlay, isUpdating]
    )

    return {
        isLoadingRange: isUpdating,
        error,
        legendItems,
        clearRanges,
        updateRanges
    }
}
