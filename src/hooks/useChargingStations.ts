import { useRef, useCallback, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import { useTheme } from '../context/ThemeContext'
import { fetchChargingStations } from '../api/mapbox'

interface ChargingStation {
  id: string
  name: string
  location: [number, number]
  type: string
  status: 'available' | 'occupied' | 'unknown'
  connectors: {
    type: string
    power: number
    count: number
  }[]
}

export const useChargingStations = (
  map: React.RefObject<mapboxgl.Map | null>
) => {
  const markers = useRef<mapboxgl.Marker[]>([])
  const popups = useRef<mapboxgl.Popup[]>([])
  const { isDarkMode } = useTheme()

  // Clear all charging station markers
  const clearStations = useCallback(() => {
    markers.current.forEach((marker) => marker.remove())
    popups.current.forEach((popup) => popup.remove())
    markers.current = []
    popups.current = []
  }, [])

  // Fetch charging stations from our secure API
  const fetchStations = useCallback(
    async (center: [number, number], radius: number) => {
      if (!map.current) {
        console.error('Map not initialized')
        return
      }

      try {
        // Clear existing markers
        clearStations()

        // Fetch stations from our secure API
        const response = await fetchChargingStations(center, radius)

        if (response.error) {
          console.error('Error fetching charging stations:', response.error)
          return
        }

        if (!response.stations || response.stations.length === 0) {
          return
        }

        // Process each charging station
        response.stations.forEach((station: ChargingStation) => {
          // Create marker with custom styling
          const marker = new mapboxgl.Marker({
            color: isDarkMode ? '#60A5FA' : '#3B82F6',
            scale: 0.8,
            anchor: 'bottom'
          })
            .setLngLat(station.location)
            .addTo(map.current!)

          // Create popup with custom styling
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <div class="font-semibold text-gray-900 dark:text-gray-100">${station.name}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">${station.type}</div>
              <div class="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Status: ${station.status}
              </div>
              ${
                station.connectors.length > 0
                  ? `
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Connectors:
                  <ul class="mt-1">
                    ${station.connectors
                      .map(
                        (conn) => `
                      <li>${conn.type} - ${conn.power}kW (${conn.count} available)</li>
                    `
                      )
                      .join('')}
                  </ul>
                </div>
              `
                  : ''
              }
            </div>
          `)

          // Add click handler
          marker.setPopup(popup)

          // Store references
          markers.current.push(marker)
          popups.current.push(popup)
        })
      } catch (error) {
        console.error('Error processing charging stations:', error)
      }
    },
    [map, clearStations, isDarkMode]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearStations()
    }
  }, [clearStations])

  return {
    fetchChargingStations: fetchStations,
    clearStations
  }
}
