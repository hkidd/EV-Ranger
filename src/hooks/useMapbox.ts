import { useRef, useEffect, RefObject, useState, useCallback } from 'react'
import mapboxgl, { LayerSpecification, SourcesSpecification } from 'mapbox-gl'
import MapboxGeocoder, { Result } from '@mapbox/mapbox-gl-geocoder'
import type { GeocoderOptions } from '@mapbox/mapbox-gl-geocoder'
import { useTheme } from '../context/ThemeContext'
import { searchLocation } from '../api/mapbox'

// Set the Mapbox token from environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Map style URLs
const LIGHT_STYLE = 'mapbox://styles/mapbox/streets-v11'
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v10'
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v11'

interface GeocodingFeature {
  id: string
  text: string
  center: [number, number]
  place_name: string
  bbox?: [number, number, number, number]
  properties?: {
    type?: string
    mapbox_id?: string
    wikidata?: string
    short_code?: string
  }
  context?: Array<{
    id: string
    text: string
    language?: string
    short_code?: string
  }>
  relevance?: number
  place_type?: string[]
}

export const useMapbox = (mapContainer: RefObject<HTMLDivElement>) => {
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  )
  const satelliteViewActive = useRef<boolean>(false)
  const { isDarkMode } = useTheme()

  // Function to update control styles based on theme
  const updateControlStyles = useCallback(() => {
    if (!map.current) return

    // Update attribution styles only
    const attribution = document.querySelector('.mapboxgl-ctrl-attrib')
    if (attribution) {
      attribution.classList.add('dark:text-foreground')
    }
  }, [isDarkMode])

  // Initialize the map
  useEffect(() => {
    if (map.current) return // Map already initialized

    // Create map instance
    const initialStyle = isDarkMode ? DARK_STYLE : LIGHT_STYLE
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: initialStyle,
      center: [-98.5795, 39.8283], // Center of USA (lng, lat)
      zoom: 3
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add geocoder for location search
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken as string,
      mapboxgl: mapboxgl as unknown as typeof import('mapbox-gl'),
      marker: false,
      placeholder: 'Search for a location',
      externalGeocoder: async (query: string): Promise<Result[]> => {
        // Ensure map is loaded before searching
        if (!map.current || !map.current.loaded()) {
          console.warn('Map not yet loaded, waiting...')
          return []
        }

        try {
          const response = await searchLocation(query)

          if (!response || !response.features) {
            console.error('Invalid response from geocoding API')
            return []
          }
          return response.features.map((feature: GeocodingFeature) => ({
            id: feature.id,
            text: feature.text,
            center: feature.center,
            place_name: feature.place_name,
            properties: feature.properties || {},
            bbox: feature.bbox || [0, 0, 0, 0],
            place_type: feature.place_type || [],
            relevance: feature.relevance || 0,
            context: feature.context || [],
            address: feature.place_name,
            type: 'Feature' as const,
            geometry: {
              type: 'Point',
              coordinates: feature.center
            }
          }))
        } catch (error) {
          console.error('Error searching location:', error)
          // Show error message in the geocoder input
          const geocoderInput = document.querySelector(
            '.mapboxgl-ctrl-geocoder input'
          )
          if (geocoderInput instanceof HTMLInputElement) {
            geocoderInput.value = 'Error searching location. Please try again.'
          }
          return []
        }
      }
    } as unknown as GeocoderOptions)

    // Add the geocoder to the map
    map.current.addControl(geocoder, 'top-left')

    // Add geolocate control to get user's location
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: false
    })

    map.current.addControl(geolocate, 'top-right')

    // Add a marker that can be dragged
    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([-98.5795, 39.8283]) // (lng, lat)
      .addTo(map.current)

    // Initial marker position (lng, lat)
    setMarkerPosition([-98.5795, 39.8283])

    // Listen for geocoder results
    geocoder.on('result', (e) => {
      if (!map.current || !marker.current || !e.result.center) return

      const lngLat = e.result.center // [lng, lat] format from Mapbox
      marker.current.setLngLat(lngLat)

      // Maintain [lng, lat] order - no swapping
      setMarkerPosition([lngLat[0], lngLat[1]])

      // Center map on the marker with proper zoom level
      map.current.flyTo({
        center: lngLat,
        zoom: 12,
        essential: true
      })
    })

    // Listen for geolocate events
    geolocate.on('geolocate', (e) => {
      if (marker.current && e.coords) {
        const lat = e.coords.latitude
        const lng = e.coords.longitude

        // Create coordinates in [lng, lat] format
        const lngLat: [number, number] = [lng, lat]

        marker.current.setLngLat(lngLat)
        setMarkerPosition(lngLat) // Store as [lng, lat]

        // Fly to the location
        map.current?.flyTo({
          center: lngLat,
          zoom: 12,
          essential: true
        })
      }
    })

    // Update control styles after map loads
    map.current.on('load', updateControlStyles)

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapContainer, updateControlStyles])

  // Update control styles when theme changes
  useEffect(() => {
    if (map.current) {
      updateControlStyles()
    }
  }, [isDarkMode, updateControlStyles])

  // Update base map theme based on dark/light preference
  const updateBaseMapTheme = useCallback(() => {
    if (!map.current) return

    // Ensure map is loaded before proceeding
    if (!map.current.loaded()) {
      console.warn('Map not yet loaded, waiting...')
      return
    }

    // Store current zoom and center before style change
    const currentZoom = map.current.getZoom()
    const currentCenter = map.current.getCenter()
    const currentBearing = map.current.getBearing()
    const currentPitch = map.current.getPitch()

    // Remember if satellite was active
    const wasSatelliteActive = satelliteViewActive.current

    // Store current range layers and sources before style change
    const customLayers: LayerSpecification[] = []
    const customSources: SourcesSpecification = {}

    try {
      // Current style and its layers
      const style = map.current.getStyle()

      // Find custom range visualization layers (assuming they have 'range' in their ID)
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (layer.id.includes('range')) {
            customLayers.push(layer)
          }
        })
      }

      // Find custom sources
      if (style && style.sources) {
        Object.keys(style.sources).forEach((sourceId) => {
          if (sourceId.includes('range')) {
            try {
              // Getting source data can be tricky - we'll need to do our best
              const source = map.current?.getSource(sourceId)
              if (source) {
                // Store the source configuration if possible
                if (source.type === 'geojson') {
                  customSources[sourceId] = {
                    type: 'geojson',
                    data: source._data
                  }
                } else if (source.type === 'vector') {
                  customSources[sourceId] = {
                    type: 'vector',
                    url: (source as mapboxgl.VectorTileSource).url
                  }
                }
              }
            } catch (e) {
              console.warn(`Could not store source data for ${sourceId}`, e)
            }
          }
        })
      }

      // Choose the appropriate style based on dark mode setting and satellite state
      const newStyle = wasSatelliteActive
        ? SATELLITE_STYLE
        : isDarkMode
          ? DARK_STYLE
          : LIGHT_STYLE

      // Set the new style
      map.current.setStyle(newStyle)

      // Function to restore custom layers and sources
      const restoreCustomLayersAndSources = () => {
        if (!map.current) return

        // Restore custom sources first
        Object.keys(customSources).forEach((sourceId) => {
          const sourceConfig = customSources[sourceId]
          if (!map.current?.getSource(sourceId) && sourceConfig) {
            try {
              map.current?.addSource(sourceId, sourceConfig)
            } catch (e) {
              console.warn(`Failed to restore source ${sourceId}`, e)
            }
          }
        })

        // Then restore custom layers
        customLayers.forEach((layer) => {
          if (!map.current?.getLayer(layer.id)) {
            try {
              map.current?.addLayer(layer)
            } catch (e) {
              console.warn(`Failed to restore layer ${layer.id}`, e)
            }
          }
        })
      }

      // Wait for the style to load before restoring custom layers and sources
      map.current.once('style.load', () => {
        // Restore custom layers and sources
        restoreCustomLayersAndSources()

        // Restore map state
        map.current?.flyTo({
          center: currentCenter,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: currentPitch,
          essential: true
        })
      })
    } catch (error) {
      console.error('Error updating map theme:', error)
    }
  }, [isDarkMode])

  // Update map style when dark mode changes
  useEffect(() => {
    if (map.current && !satelliteViewActive.current) {
      updateBaseMapTheme()
    }
  }, [isDarkMode, updateBaseMapTheme])

  // Toggle satellite view
  const toggleSatelliteView = useCallback(() => {
    if (!map.current) return

    const style = map.current.getStyle()
    if (!style) return

    // Toggle the satellite view state first
    satelliteViewActive.current = !satelliteViewActive.current

    // Choose the new style based on the updated state
    const newStyle = satelliteViewActive.current
      ? SATELLITE_STYLE
      : isDarkMode
        ? DARK_STYLE
        : LIGHT_STYLE

    // Store current map state
    const currentZoom = map.current.getZoom()
    const currentCenter = map.current.getCenter()
    const currentBearing = map.current.getBearing()
    const currentPitch = map.current.getPitch()

    // Store current range layers and sources
    const customLayers: LayerSpecification[] = []
    const customSources: SourcesSpecification = {}

    try {
      // Find custom range visualization layers
      if (style.layers) {
        style.layers.forEach((layer) => {
          if (layer.id.includes('range')) {
            customLayers.push(layer)
          }
        })
      }

      // Find custom sources
      if (style.sources) {
        Object.keys(style.sources).forEach((sourceId) => {
          if (sourceId.includes('range')) {
            try {
              const source = map.current?.getSource(sourceId)
              if (source) {
                if (source.type === 'geojson') {
                  customSources[sourceId] = {
                    type: 'geojson',
                    data: source._data
                  }
                } else if (source.type === 'vector') {
                  customSources[sourceId] = {
                    type: 'vector',
                    url: (source as mapboxgl.VectorTileSource).url
                  }
                }
              }
            } catch (e) {
              console.warn(`Could not store source data for ${sourceId}`, e)
            }
          }
        })
      }

      // Set the new style
      map.current.setStyle(newStyle)

      // Function to restore custom layers and sources
      const restoreCustomLayersAndSources = () => {
        if (!map.current) return

        // Restore custom sources first
        Object.keys(customSources).forEach((sourceId) => {
          const sourceConfig = customSources[sourceId]
          if (!map.current?.getSource(sourceId) && sourceConfig) {
            try {
              map.current?.addSource(sourceId, sourceConfig)
            } catch (e) {
              console.warn(`Failed to restore source ${sourceId}`, e)
            }
          }
        })

        // Then restore custom layers
        customLayers.forEach((layer) => {
          if (!map.current?.getLayer(layer.id)) {
            try {
              map.current?.addLayer(layer)
            } catch (e) {
              console.warn(`Failed to restore layer ${layer.id}`, e)
            }
          }
        })
      }

      // Wait for the style to load before restoring custom layers and sources
      map.current.once('style.load', () => {
        // Restore custom layers and sources
        restoreCustomLayersAndSources()

        // Restore map state
        map.current?.flyTo({
          center: currentCenter,
          zoom: currentZoom,
          bearing: currentBearing,
          pitch: currentPitch,
          essential: true
        })

        // Update satellite view active state
        satelliteViewActive.current = newStyle.includes('satellite')
      })
    } catch (error) {
      console.error('Error toggling satellite view:', error)
    }
  }, [isDarkMode])

  // Handle location found
  const handleLocationFound = useCallback((position: GeolocationPosition) => {
    if (!map.current || !marker.current) return

    const lat = position.coords.latitude
    const lng = position.coords.longitude

    // Create coordinates in [lng, lat] format
    const lngLat: [number, number] = [lng, lat]

    marker.current.setLngLat(lngLat)
    setMarkerPosition(lngLat)

    // Fly to the location
    map.current.flyTo({
      center: lngLat,
      zoom: 12,
      essential: true
    })
  }, [])

  // Update marker position
  const updateMarkerPosition = useCallback((position: [number, number]) => {
    setMarkerPosition(position)
  }, [])

  return {
    map,
    marker,
    markerPosition,
    handleLocationFound,
    updateMarkerPosition,
    toggleSatelliteView,
    satelliteViewActive
  }
}
