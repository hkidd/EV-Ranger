import React, { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import 'leaflet/dist/leaflet.css'
import 'leaflet-geosearch/dist/geosearch.css'
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch'
import L from 'leaflet'
import type { LeafletEvent } from 'leaflet'
import { SelectedCar } from '../../types'

interface GeoSearchResultLocation {
  x: number
  y: number
  label: string
  bounds: [number, number, number, number]
}

interface GeoSearchShowLocationEvent extends LeafletEvent {
  location: GeoSearchResultLocation
}

const SearchControl = ({
  onLocationFound
}: {
  onLocationFound: (lat: number, lon: number) => void
}) => {
  const map = useMap()

  const provider = React.useMemo(() => new OpenStreetMapProvider(), [])

  useEffect(() => {
    // @ts-expect-error: waiting on proper types for GeoSearchControl (?)
    const searchControl = new GeoSearchControl({
      autoComplete: true,
      autoCompleteDelay: 250,
      provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      searchLabel: 'Enter an address to plot the range...'
    })

    map.addControl(searchControl)

    map.on('geosearch/showlocation', (event: LeafletEvent) => {
      const result = event as GeoSearchShowLocationEvent
      const { x: lon, y: lat } = result.location
      onLocationFound(lat, lon)
    })

    return () => {
      map.removeControl(searchControl)
    }
  }, [map, provider, onLocationFound])

  return null
}

// React Query Hook for Reverse Geocoding
const useReverseGeocoding = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['reverseGeocoding', lat, lon],
    queryFn: async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      if (!response.ok) throw new Error('Failed to fetch address')
      const data = await response.json()
      return data.display_name || 'Address not found'
    },
    enabled: !!lat && !!lon // Only run if lat/lng are provided
  })
}

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
  const [userPosition, setUserPosition] = useState<[number, number]>([
    39.8283, -98.5795
  ])
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  )
  const markerRef = useRef<L.Marker>(null)

  // Reverse Geocoding using TanStack Query
  const {
    data: address,
    isLoading,
    isError
  } = useReverseGeocoding(markerPosition?.[0] || 0, markerPosition?.[1] || 0)

  const handleLocationFound = (lat: number, lon: number) => {
    setMarkerPosition([lat, lon])
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserPosition([latitude, longitude])
      },
      () => {
        setUserPosition([39.8283, -98.5795])
      }
    )
  }, [])

  return (
    <div className='h-full w-full p-6 md:pr-6 md:pl-0'>
      <MapContainer
        center={userPosition}
        zoom={4}
        className='h-full w-full rounded-xl start-with-search'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <SearchControl onLocationFound={handleLocationFound} />
        {/* Marker and Popup */}
        {markerPosition && (
          <>
            <Marker position={markerPosition} ref={markerRef}>
              <Popup>
                <div>
                  {isLoading ? (
                    <p>Loading address...</p>
                  ) : isError ? (
                    <p>Failed to fetch address</p>
                  ) : (
                    <>
                      <p>
                        <strong>Address:</strong> {address}
                      </p>
                      <p>
                        <strong>Lat/Lon:</strong> {markerPosition[0]},{' '}
                        {markerPosition[1]}
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
            {/* Circles for selected cars */}
            {selectedCars.map((car) => (
              <Circle
                key={car.carId + car.color}
                center={markerPosition}
                radius={
                  car.range *
                  car.sliderFraction *
                  (externalTempAdjustment ? tempModifier : 1) *
                  1609.34
                } // Convert miles to meters
                color={car.color}
                fillColor={car.color}
                fillOpacity={0.2}
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}

export default SearchMap
