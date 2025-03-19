import React, { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { SelectedCar } from '../../types'
import useDebounce from '../../hooks/useDebounce'
import MapLegend from './MapLegend'
import { useMapbox } from '../../hooks/useMapbox'
import { useRangeVisualization } from '../../hooks/useRangeVisualization'
import { useTheme } from '../../context/ThemeContext'

interface SearchMapProps {
  externalTempAdjustment: boolean
  selectedCars: SelectedCar[]
  tempModifier: number
}

const SearchMap: React.FC<SearchMapProps> = ({
  externalTempAdjustment,
  selectedCars,
  tempModifier
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false)
  const [rangeUpdatePending, setRangeUpdatePending] = useState<boolean>(false)
  // const [chargingStationsActive, setChargingStationsActive] = useState<boolean>(false)
  const { isDarkMode } = useTheme()

  // Debounce selected cars to prevent too frequent updates
  const debouncedSelectedCars = useDebounce(selectedCars, 500)

  // Use our custom hooks
  const {
    map,
    marker,
    markerPosition,
    handleLocationFound,
    updateMarkerPosition
  } = useMapbox(mapContainer as React.RefObject<HTMLDivElement>)

  const { isLoadingRange, updateRanges, clearRanges, legendItems } =
    useRangeVisualization(map, isDarkMode)

  // const { clearStations } = useChargingStations(map)

  // Handle charging station toggle
  // const handleToggleChargingStations = useCallback(() => {
  //   setChargingStationsActive((prev) => {
  //     if (!prev && markerPosition) {
  //       // Calculate the maximum range among selected cars
  //       const maxRange = Math.max(
  //         ...debouncedSelectedCars.map((car) => {
  //           const baseRange = car.range || 250
  //           const fractionEffect = car.sliderFraction || 1
  //           const tempEffect = externalTempAdjustment ? tempModifier : 1
  //           return baseRange * fractionEffect * tempEffect
  //         })
  //       )

  //       // Fetch charging stations within the maximum range
  //       fetchChargingStations(markerPosition, maxRange)
  //     } else {
  //       clearStations()
  //     }
  //     return !prev
  //   })
  // }, [
  //   markerPosition,
  //   debouncedSelectedCars,
  //   externalTempAdjustment,
  //   tempModifier,
  //   fetchChargingStations,
  //   clearStations
  // ])

  // Ensure proper map initialization
  useEffect(() => {
    if (!map.current) return

    const checkMapReady = () => {
      if (map.current && map.current.loaded()) {
        setIsMapLoaded(true)
        // Request user's location when map is ready
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => handleLocationFound(position),
            (error) => console.error('Error getting location:', error)
          )
        }
        return true
      }
      return false
    }

    // Try to check immediately
    if (checkMapReady()) return

    // Set up load event listener
    const onLoad = () => {
      if (checkMapReady() && rangeUpdatePending) {
        setRangeUpdatePending(false)
        triggerRangeUpdate()
      }
    }

    map.current.on('load', onLoad)

    // Safety timeout in case the load event doesn't fire
    const timeout = setTimeout(() => {
      if (checkMapReady() && rangeUpdatePending) {
        setRangeUpdatePending(false)
        triggerRangeUpdate()
      }
    }, 2000)

    return () => {
      clearTimeout(timeout)
      if (map.current) {
        map.current.off('load', onLoad)
      }
    }
  }, [map.current, rangeUpdatePending])

  // Helper function to trigger range updates safely
  const triggerRangeUpdate = () => {
    if (!map.current || !markerPosition || !isMapLoaded) {
      setRangeUpdatePending(true)
      return
    }

    if (debouncedSelectedCars.length === 0) {
      clearRanges()
      // clearStations()
      return
    }

    // Ensure we have a valid array for marker position
    if (!Array.isArray(markerPosition) || markerPosition.length !== 2) {
      console.error('Invalid marker position format:', markerPosition)
      return
    }

    const position: [number, number] = [
      Number(markerPosition[1]), // Latitude (swap from lng,lat to lat,lng)
      Number(markerPosition[0]) // Longitude
    ]

    // Update ranges
    updateRanges(
      debouncedSelectedCars,
      position,
      externalTempAdjustment,
      tempModifier
    )

    // Update charging stations if they're active
    // if (chargingStationsActive) {
    //   // Calculate the maximum range among selected cars
    //   const maxRange = Math.max(
    //     ...debouncedSelectedCars.map((car) => {
    //       const baseRange = car.range || 250
    //       const fractionEffect = car.sliderFraction || 1
    //       const tempEffect = externalTempAdjustment ? tempModifier : 1
    //       return baseRange * fractionEffect * tempEffect
    //     })
    //   )

    //   // Fetch charging stations within the maximum range
    //   fetchChargingStations(position, maxRange)
    // }
  }

  // Update ranges when necessary inputs change
  useEffect(() => {
    triggerRangeUpdate()
  }, [
    debouncedSelectedCars,
    markerPosition,
    externalTempAdjustment,
    tempModifier,
    isMapLoaded
  ])

  // Handle marker drag events
  useEffect(() => {
    if (!marker.current) return

    const onDragEnd = () => {
      if (!marker.current) return

      const lngLat = marker.current.getLngLat()

      // Always use [longitude, latitude] order for Mapbox
      const newPosition: [number, number] = [lngLat.lng, lngLat.lat]

      // Update the marker position
      updateMarkerPosition(newPosition)

      // Range update will be triggered by markerPosition change
    }

    marker.current.on('dragend', onDragEnd)

    return () => {
      if (marker.current) {
        marker.current.off('dragend', onDragEnd)
      }
    }
  }, [marker])

  return (
    <div className='h-full w-full p-4 md:py-6 md:pr-6 md:pl-0 relative'>
      <div
        ref={mapContainer}
        className='h-full w-full rounded-xl'
        style={{ position: 'relative' }}
      />

      {/* Legend Component */}
      <MapLegend legendItems={legendItems} />

      {/* Loading Overlay */}
      {isLoadingRange && (
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-content1 dark:bg-content1 p-3 rounded-md shadow z-10'>
          <p className='text-sm text-foreground dark:text-foreground'>
            Creating range visualization...
          </p>
        </div>
      )}
    </div>
  )
}

export default SearchMap
