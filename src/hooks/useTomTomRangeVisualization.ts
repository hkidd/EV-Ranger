import { useState, useRef, useCallback } from 'react'
import * as turf from '@turf/turf'
import {
    tomtomApi,
    convertEpaRangeToEnergyBudget,
    tomtomBoundaryToGeoJson
} from '../api/tomtom'

// TomTom API response types
interface TomTomReachableRangeData {
    reachableRange: {
        boundary: Array<{
            latitude: number
            longitude: number
        }>
        center: {
            latitude: number
            longitude: number
        }
    }
}

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
    batteryCapacityKwh?: number
}

interface LegendItem {
    carId: string
    brand: string
    model: string
    variantName: string
    color: string
    range: number
    accuracyLevel: 'tomtom' | 'algorithmic' | 'circle'
}

interface TomTomRangeOptions {
    enabled: boolean
    fallbackToAlgorithmic: boolean
    fallbackToCircle: boolean
    routeType: 'eco' | 'fast' | 'shortest'
    cacheTimeout: number // minutes
}

export const useTomTomRangeVisualization = (
    map: MapRef,
    isDarkMode: boolean,
    tomtomOptions: TomTomRangeOptions = {
        enabled: true,
        fallbackToAlgorithmic: true,
        fallbackToCircle: true,
        routeType: 'eco',
        cacheTimeout: 30
    }
) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [legendItems, setLegendItems] = useState<LegendItem[]>([])
    const rangeFeatures = useRef<RangeFeature[]>([])

    // Cache for TomTom responses
    const tomtomCache = useRef<
        Map<
            string,
            {
                data: TomTomReachableRangeData
                timestamp: number
            }
        >
    >(new Map())

    // Store previous update info for optimization
    const prevUpdateRef = useRef({
        position: null as string | null,
        cars: null as string | null
    })

    // Helper function to validate coordinates
    const isValidCoordinate = useCallback(
        (coord: [number, number]): boolean => {
            if (!Array.isArray(coord) || coord.length !== 2) return false
            if (
                !Number.isFinite(Number(coord[0])) ||
                !Number.isFinite(Number(coord[1]))
            )
                return false

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
                return false
            }

            return true
        },
        []
    )

    // Create circle feature (fallback)
    const createCircleFeature = useCallback(
        (center: [number, number], rangeMiles: number) => {
            return turf.circle(center, rangeMiles, {
                units: 'miles',
                steps: 64
            })
        },
        []
    )

    // Create algorithmic range shape (fallback from existing implementation)
    const createAlgorithmicRangeShape = useCallback(
        (
            center: [number, number],
            baseRangeMiles: number
        ): GeoJSON.Feature<GeoJSON.Polygon> => {
            const [lng, lat] = center

            // Simplified algorithmic approach (extracted from original implementation)
            let roadPattern = {
                primaryDirection: 90,
                secondaryDirection: 0,
                coastalInfluence: 0.2,
                mountainInfluence: 0.3,
                urbanDensity: 0.5
            }

            let knownBarriers: Array<{ direction: number; severity: number }> =
                []

            // Texas patterns
            if (lng >= -106 && lng <= -93 && lat >= 25 && lat <= 37) {
                roadPattern = {
                    primaryDirection: 90,
                    secondaryDirection: 0,
                    coastalInfluence: 0.3,
                    mountainInfluence: 0.1,
                    urbanDensity: 0.6
                }
                knownBarriers = [
                    { direction: 180, severity: 0.6 },
                    { direction: 225, severity: 0.3 }
                ]
            }
            // California patterns
            else if (lng >= -125 && lng <= -114 && lat >= 32 && lat <= 42) {
                roadPattern = {
                    primaryDirection: 0,
                    secondaryDirection: 90,
                    coastalInfluence: 0.8,
                    mountainInfluence: 0.7,
                    urbanDensity: 0.8
                }
                knownBarriers = [
                    { direction: 270, severity: 0.8 },
                    { direction: 90, severity: 0.6 }
                ]
            }
            // Florida patterns
            else if (lng >= -87 && lng <= -80 && lat >= 24 && lat <= 31) {
                roadPattern = {
                    primaryDirection: 0,
                    secondaryDirection: 90,
                    coastalInfluence: 0.9,
                    mountainInfluence: 0.0,
                    urbanDensity: 0.7
                }
                knownBarriers = [
                    { direction: 90, severity: 0.9 },
                    { direction: 270, severity: 0.8 }
                ]
            }

            const sampleCount = 24
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

                // Apply influences
                if (roadPattern.coastalInfluence > 0.5) {
                    rangeMultiplier -= roadPattern.coastalInfluence * 0.1
                }
                if (roadPattern.mountainInfluence > 0.5) {
                    rangeMultiplier -= roadPattern.mountainInfluence * 0.15
                }
                rangeMultiplier += roadPattern.urbanDensity * 0.08

                // Add randomness
                const randomVariation = (Math.random() - 0.5) * 0.08
                rangeMultiplier += randomVariation

                // Clamp bounds
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

            coordinates.push(coordinates[0])
            return turf.polygon([coordinates])
        },
        []
    )

    // Helper function for angle alignment
    const getAlignment = (angle1: number, angle2: number): number => {
        const diff = Math.abs(((angle1 - angle2 + 180) % 360) - 180)
        return Math.max(0, 1 - diff / 90)
    }

    // Create TomTom reachable range feature
    const createTomTomRangeFeature = useCallback(
        async (
            center: [number, number],
            rangeMiles: number,
            batteryCapacityKwh: number = 100
        ): Promise<{
            feature: GeoJSON.Feature
            accuracyLevel: 'tomtom' | 'algorithmic' | 'circle'
        }> => {
            if (!tomtomOptions.enabled) {
                return {
                    feature: createAlgorithmicRangeShape(center, rangeMiles),
                    accuracyLevel: 'algorithmic'
                }
            }

            try {
                const [lng, lat] = center
                const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${rangeMiles.toFixed(1)},${batteryCapacityKwh}`

                // Check cache first
                const cached = tomtomCache.current.get(cacheKey)
                if (
                    cached &&
                    Date.now() - cached.timestamp <
                        tomtomOptions.cacheTimeout * 60000
                ) {
                    return {
                        feature: tomtomBoundaryToGeoJson(
                            cached.data.reachableRange.boundary
                        ),
                        accuracyLevel: 'tomtom'
                    }
                }

                // Convert UI-calculated adjusted range to energy budget
                // Note: rangeMiles already includes battery %, temperature, and slider adjustments from UI
                const energyBudgetInkWh = convertEpaRangeToEnergyBudget(
                    rangeMiles,
                    batteryCapacityKwh
                )

                const response = await tomtomApi.getReachableRange({
                    latitude: lat,
                    longitude: lng,
                    energyBudgetInkWh,
                    routeType: tomtomOptions.routeType
                })

                // Cache the response
                tomtomCache.current.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                })

                // Convert TomTom boundary to GeoJSON
                const feature = tomtomBoundaryToGeoJson(
                    response.data.reachableRange.boundary
                )

                return {
                    feature,
                    accuracyLevel: 'tomtom'
                }
            } catch (error) {
                console.error('❌ TomTom API call failed:', error)

                if (tomtomOptions.fallbackToAlgorithmic) {
                    return {
                        feature: createAlgorithmicRangeShape(
                            center,
                            rangeMiles
                        ),
                        accuracyLevel: 'algorithmic'
                    }
                } else if (tomtomOptions.fallbackToCircle) {
                    return {
                        feature: createCircleFeature(center, rangeMiles),
                        accuracyLevel: 'circle'
                    }
                }

                throw error
            }
        },
        [tomtomOptions, createAlgorithmicRangeShape, createCircleFeature]
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

    // Add range overlay to map
    const addRangeOverlay = useCallback(
        async (
            center: [number, number],
            rangeMiles: number,
            carId: string,
            color: string,
            batteryCapacityKwh?: number
        ): Promise<{
            success: boolean
            accuracyLevel: 'tomtom' | 'algorithmic' | 'circle'
        }> => {
            if (!map.current) return { success: false, accuracyLevel: 'circle' }

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

                // Create feature using TomTom or fallback
                const { feature, accuracyLevel } =
                    await createTomTomRangeFeature(
                        center,
                        rangeMiles,
                        batteryCapacityKwh
                    )

                const fillColor = color
                const borderColor = isDarkMode
                    ? colorModifier(color, 30)
                    : colorModifier(color, -30)

                // Add source
                map.current.addSource(sourceId, {
                    type: 'geojson',
                    data: feature
                })

                // Add fill layer with opacity based on accuracy
                const baseOpacity =
                    accuracyLevel === 'tomtom'
                        ? 0.4
                        : accuracyLevel === 'algorithmic'
                          ? 0.3
                          : 0.25

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
                                baseOpacity + 0.1,
                                baseOpacity
                            ],
                            'fill-translate': [0, 0],
                            'fill-antialias': true
                        }
                    },
                    'water'
                )

                // Add border layer with different styling based on accuracy
                const borderWidth = accuracyLevel === 'tomtom' ? 2 : 1.5
                const borderOpacity = accuracyLevel === 'tomtom' ? 0.9 : 0.8

                // Create paint object conditionally
                const borderPaint: mapboxgl.LinePaint = {
                    'line-color': borderColor,
                    'line-width': borderWidth,
                    'line-opacity': borderOpacity
                }

                // Only add line-dasharray if it's a circle (fallback)
                if (accuracyLevel === 'circle') {
                    borderPaint['line-dasharray'] = [2, 2]
                }

                map.current.addLayer(
                    {
                        id: borderId,
                        type: 'line',
                        source: sourceId,
                        paint: borderPaint
                    },
                    'water'
                )

                rangeFeatures.current.push(
                    { id: layerId, source: sourceId },
                    { id: borderId, source: sourceId }
                )

                return { success: true, accuracyLevel }
            } catch (error) {
                console.error('Error adding range overlay:', error)
                setError('Failed to visualize range. Please try again.')
                return { success: false, accuracyLevel: 'circle' }
            }
        },
        [map, createTomTomRangeFeature, isDarkMode, colorModifier]
    )

    // Clear all range visualizations
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

    // Update ranges for all selected cars
    const updateRanges = useCallback(
        async (
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

            if (isUpdating) {
                return
            }

            prevUpdateRef.current = { position: positionKey, cars: carsKey }

            setIsUpdating(true)
            clearRanges()

            if (selectedCars.length === 0) {
                setIsUpdating(false)
                return
            }

            try {
                const results = await Promise.all(
                    selectedCars.map(async (car) => {
                        const baseRange = car.range || 250
                        const fractionEffect = car.sliderFraction || 1
                        const tempEffect = externalTempAdjustment
                            ? tempModifier
                            : 1
                        const adjustedRange =
                            baseRange * fractionEffect * tempEffect

                        const result = await addRangeOverlay(
                            correctedPosition,
                            adjustedRange,
                            car.carId,
                            car.color || '#3B82F6',
                            car.batteryCapacityKwh
                        )

                        return {
                            car,
                            accuracyLevel: result.accuracyLevel,
                            success: result.success
                        }
                    })
                )

                // Update legend with accuracy information
                setLegendItems(
                    results
                        .filter((r) => r.success)
                        .map(({ car, accuracyLevel }) => ({
                            carId: car.carId,
                            brand: car.brand,
                            model: car.model,
                            variantName: car.variantName || `Car ${car.carId}`,
                            color: car.color || '#3B82F6',
                            range: car.range || 250,
                            accuracyLevel
                        }))
                )
            } catch (error) {
                console.error('Error creating range visualization:', error)
                setError(
                    'Failed to create range visualization. Please try again.'
                )
            } finally {
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
        updateRanges,
        tomtomEnabled: tomtomOptions.enabled
    }
}
