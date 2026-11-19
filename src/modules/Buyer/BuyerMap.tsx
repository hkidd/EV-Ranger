import { INTERESTS } from './exploration'
import { tripCameraFrame } from './mapCamera'
import { reachAreaFeatures } from './reachModel'
import { vehicleColor } from './vehicleAppearance'
import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTheme } from '../../context/ThemeContext'
import { routeSegments, vehicleTitle } from './estimates'
import type {
  Place,
  LifeTrip,
  Scenario,
  VehicleOption,
  DiscoveryResult,
  MapViewport
} from './types'
interface Props {
  discoverMode: boolean
  discovery: DiscoveryResult | null
  vehicles: VehicleOption[]
  origin: Place | null
  trips: LifeTrip[]
  activeTrip: LifeTrip | undefined
  vehicle: VehicleOption | undefined
  scenario: Scenario
  onSelectTrip: (id: string) => void
  onViewport: (viewport: MapViewport) => void
  onSelectPlace: (id: string) => void
}
export default function BuyerMap({
  discoverMode,
  discovery,
  vehicles,
  origin,
  trips,
  activeTrip,
  vehicle,
  scenario,
  onSelectTrip,
  onViewport,
  onSelectPlace
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [compact, setCompact] = useState(
    () => window.matchMedia('(max-width: 760px)').matches
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const update = () => setCompact(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const interactionHandlersRef = useRef({ onViewport, onSelectPlace })
  useEffect(() => {
    interactionHandlersRef.current = { onViewport, onSelectPlace }
  }, [onViewport, onSelectPlace])
  const previousVehicleIdRef = useRef('')
  const cameraRef = useRef<{ center: [number, number]; zoom: number } | null>(
    null
  )
  const [ready, setReady] = useState(false)
  const [issue, setIssue] = useState('')
  const { isDarkMode } = useTheme()
  const routeData = useMemo(
    () =>
      activeTrip?.route
        ? routeSegments(activeTrip.route, vehicle, scenario)
        : {
            type: 'FeatureCollection' as const,
            features: discovery?.selectedPlace?.route
              ? routeSegments(discovery.selectedPlace.route, vehicle, scenario)
                  .features
              : []
          },
    [activeTrip, vehicle, scenario, discovery]
  )
  /* eslint-disable react-hooks/set-state-in-effect -- Reset readiness when replacing the external Mapbox instance or reporting initialization failure. */
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      setIssue(
        'Add a public Mapbox token to display the map. Vehicle comparisons are still available.'
      )
      return
    }
    if (!containerRef.current) return
    setReady(false)
    setIssue('')
    let mapInstance: mapboxgl.Map
    try {
      mapInstance = new mapboxgl.Map({
        container: containerRef.current,
        accessToken: token,
        style: isDarkMode
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: cameraRef.current?.center ?? [-98.5795, 39.8283],
        zoom: cameraRef.current?.zoom ?? 3.3,
        projection: 'mercator',
        cooperativeGestures: true,
        attributionControl: true
      })
      mapRef.current = mapInstance
      mapInstance.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        'bottom-right'
      )
      mapInstance.once('load', () => {
        // Hide basemap POIs so they do not duplicate the discovery layer.
        for (const layer of mapInstance.getStyle()?.layers ?? []) {
          const name = layer.id.toLowerCase()
          if (name.includes('poi') || name.includes('transit'))
            mapInstance.setLayoutProperty(layer.id, 'visibility', 'none')
          if (layer.type === 'background')
            mapInstance.setPaintProperty(
              layer.id,
              'background-color',
              isDarkMode ? '#1b2a25' : '#e9eeea'
            )
          if (layer.type === 'fill' && name.includes('water'))
            mapInstance.setPaintProperty(
              layer.id,
              'fill-color',
              isDarkMode ? '#253f3e' : '#c6d8d7'
            )
          if (
            layer.type === 'fill' &&
            (name.includes('landuse') || name.includes('landcover'))
          ) {
            mapInstance.setPaintProperty(
              layer.id,
              'fill-color',
              isDarkMode ? '#293d2f' : '#dce6d9'
            )
          }
        }

        mapInstance.addSource('buyer-reach', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        })
        mapInstance.addLayer({
          id: 'buyer-reach-fill',
          type: 'fill',
          source: 'buyer-reach',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': ['case', ['get', 'active'], 0.08, 0.035]
          }
        })
        mapInstance.addLayer({
          id: 'buyer-reach-edge',
          type: 'line',
          source: 'buyer-reach',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['case', ['get', 'active'], 2.5, 1.5],
            'line-dasharray': [3, 2]
          }
        })
        mapInstance.addSource('buyer-route', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        })
        mapInstance.addLayer({
          id: 'buyer-route-outline',
          type: 'line',
          source: 'buyer-route',
          paint: {
            'line-color': isDarkMode ? '#132021' : '#ffffff',
            'line-width': 9,
            'line-opacity': 0.9
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' }
        })
        mapInstance.addLayer({
          id: 'buyer-route-line',
          type: 'line',
          source: 'buyer-route',
          paint: {
            'line-color': [
              'match',
              ['get', 'status'],
              'reserve-met',
              isDarkMode ? '#94cfa5' : '#206947',
              'below-reserve',
              isDarkMode ? '#efbf5b' : '#9a6100',
              'needs-charge',
              isDarkMode ? '#f49b83' : '#b44331',
              isDarkMode ? '#c5d97b' : '#47643d'
            ],
            'line-width': 5,
            'line-width-transition': { duration: 180 }
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' }
        })
        mapInstance.addSource('buyer-pois', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 45,
          clusterProperties: Object.fromEntries(
            INTERESTS.map((i) => [
              i.id,
              ['+', ['case', ['==', ['get', 'category'], i.id], 1, 0]]
            ])
          )
        })
        // Cluster color follows the most common interest; car colors remain on range edges.
        const clusterColor: mapboxgl.ExpressionSpecification = [
          'case',
          [
            'all',
            ['>=', ['get', 'parks'], ['get', 'attractions']],
            ['>=', ['get', 'parks'], ['get', 'museums']],
            ['>=', ['get', 'parks'], ['get', 'camping']]
          ],
          INTERESTS[0].color,
          [
            'all',
            ['>=', ['get', 'attractions'], ['get', 'museums']],
            ['>=', ['get', 'attractions'], ['get', 'camping']]
          ],
          INTERESTS[1].color,
          ['>=', ['get', 'museums'], ['get', 'camping']],
          INTERESTS[2].color,
          INTERESTS[3].color
        ]
        mapInstance.addLayer({
          id: 'buyer-poi-clusters',
          type: 'circle',
          source: 'buyer-pois',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': clusterColor,
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              20,
              23,
              100,
              29
            ],
            'circle-stroke-color': isDarkMode ? '#e5ebd6' : '#fff',
            'circle-stroke-width': 2
          }
        })
        mapInstance.addLayer({
          id: 'buyer-poi-count',
          type: 'symbol',
          source: 'buyer-pois',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
          },
          paint: { 'text-color': '#fff' }
        })
        mapInstance.addLayer({
          id: 'buyer-poi-points',
          type: 'circle',
          source: 'buyer-pois',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'category'],
              ...INTERESTS.flatMap((i) => [i.id, i.color]),
              '#398261'
            ],
            'circle-radius': ['case', ['get', 'selected'], 9, 6],
            'circle-stroke-width': ['case', ['get', 'selected'], 3, 1.5],
            'circle-stroke-color': isDarkMode ? '#e5ebd6' : '#fff'
          }
        })
        mapInstance.addLayer({
          id: 'buyer-poi-labels',
          type: 'symbol',
          source: 'buyer-pois',
          minzoom: 10,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 11,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-max-width': 14
          },
          paint: {
            'text-color': isDarkMode ? '#e5ebd6' : '#1d3428',
            'text-halo-color': isDarkMode ? '#1b2a25' : '#fff',
            'text-halo-width': 1.5
          }
        })
        mapInstance.on('click', 'buyer-poi-clusters', (event) => {
          const feature = event.features?.[0]
          if (!feature || feature.geometry.type !== 'Point') return
          const source = mapInstance.getSource(
            'buyer-pois'
          ) as mapboxgl.GeoJSONSource
          source.getClusterExpansionZoom(
            Number(feature.properties?.cluster_id),
            (error, zoom) => {
              if (
                !error &&
                zoom !== null &&
                zoom !== undefined &&
                mapRef.current === mapInstance
              )
                mapInstance.easeTo({
                  center:
                    feature.geometry.type === 'Point'
                      ? (feature.geometry.coordinates as [number, number])
                      : [0, 0],
                  zoom,
                  duration: window.matchMedia(
                    '(prefers-reduced-motion: reduce)'
                  ).matches
                    ? 0
                    : 450
                })
            }
          )
        })
        mapInstance.on('click', 'buyer-poi-points', (event) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === 'string')
            interactionHandlersRef.current.onSelectPlace(id)
        })
        for (const layer of ['buyer-poi-points', 'buyer-poi-clusters']) {
          mapInstance.on('mouseenter', layer, () => {
            mapInstance.getCanvas().style.cursor = 'pointer'
          })
          mapInstance.on('mouseleave', layer, () => {
            mapInstance.getCanvas().style.cursor = ''
          })
        }
        const reportViewport = () => {
          const bounds = mapInstance.getBounds()
          if (bounds)
            interactionHandlersRef.current.onViewport({
              west: bounds.getWest(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              north: bounds.getNorth(),
              zoom: mapInstance.getZoom()
            })
        }
        mapInstance.on('moveend', reportViewport)
        reportViewport()
        setIssue('')
        setReady(true)
      })
      mapInstance.on('error', () => {
        if (!mapInstance.isStyleLoaded())
          setIssue(
            'The map could not load. Check your browser token and connection; the comparison results remain available.'
          )
      })
    } catch {
      setIssue(
        'Interactive mapping is unavailable in this browser. You can still compare trip estimates.'
      )
      return
    }
    const observer = new ResizeObserver(() => mapInstance.resize())
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      const center = mapInstance.getCenter()
      cameraRef.current = {
        center: [center.lng, center.lat],
        zoom: mapInstance.getZoom()
      }
      mapInstance.remove()
      mapRef.current = null
    }
  }, [isDarkMode])
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const source = mapRef.current.getSource('buyer-route') as
      mapboxgl.GeoJSONSource | undefined
    source?.setData(routeData)
    let settle: ReturnType<typeof setTimeout> | undefined
    if (
      vehicle &&
      previousVehicleIdRef.current &&
      previousVehicleIdRef.current !== vehicle.variant.id &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const mapInstance = mapRef.current
      mapInstance.setPaintProperty('buyer-route-line', 'line-width', 7)
      settle = setTimeout(() => {
        if (mapRef.current === mapInstance)
          mapInstance.setPaintProperty('buyer-route-line', 'line-width', 5)
      }, 180)
    } else {
      mapRef.current.setPaintProperty('buyer-route-line', 'line-width', 5)
    }
    previousVehicleIdRef.current = vehicle?.variant.id ?? ''
    return () => clearTimeout(settle)
  }, [routeData, ready, vehicle])
  useEffect(() => {
    if (!ready || !mapRef.current) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    const points = [
      ...(origin ? [{ place: origin, text: 'H', home: true, id: '' }] : []),
      ...trips.map((trip, i) => ({
        place: trip.place,
        text: String(i + 1),
        home: false,
        id: trip.id
      }))
    ]
    points.forEach((point) => {
      const element = document.createElement(point.home ? 'div' : 'button')
      element.className = `buyer-map-marker${point.home ? ' home' : ''}`
      element.textContent = point.text
      element.setAttribute(
        'aria-label',
        point.home
          ? `Starting point: ${point.place.label}`
          : `Show trip to ${point.place.label}`
      )
      if (!point.home) {
        element.setAttribute('type', 'button')
        element.setAttribute('role', 'button')
        element.setAttribute(
          'aria-pressed',
          String(activeTrip?.id === point.id)
        )
        element.addEventListener('click', () => onSelectTrip(point.id))
      }
      markersRef.current.push(
        new mapboxgl.Marker({ element })
          .setLngLat(point.place.coordinates)
          .addTo(mapRef.current!)
      )
    })
  }, [origin, trips, activeTrip?.id, onSelectTrip, ready])
  const tripFrame = tripCameraFrame(origin, trips, activeTrip)
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const { coordinates } = JSON.parse(tripFrame) as {
      coordinates: [number, number][]
    }
    if (!coordinates.length) return
    const bounds = new mapboxgl.LngLatBounds()
    coordinates.forEach((point) => bounds.extend(point))
    mapRef.current.fitBounds(bounds, {
      padding: compact
        ? { top: 70, bottom: 140, left: 40, right: 45 }
        : { top: 95, bottom: 85, left: 350, right: 90 },
      maxZoom: coordinates.length === 1 ? 9 : 12,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 700
    })
  }, [tripFrame, ready, compact])
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const source = mapRef.current.getSource('buyer-reach') as
      mapboxgl.GeoJSONSource | undefined
    source?.setData(
      reachAreaFeatures(
        discovery,
        origin,
        vehicles,
        scenario,
        vehicle?.car.id,
        isDarkMode
      )
    )
    const points = mapRef.current.getSource('buyer-pois') as
      mapboxgl.GeoJSONSource | undefined
    points?.setData({
      type: 'FeatureCollection',
      features: (discovery?.places || []).map((place) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: place.coordinates },
        properties: {
          id: place.id,
          label: place.label,
          category: place.category,
          selected: place.id === discovery?.selectedPlace?.id
        }
      }))
    })
  }, [discovery, origin, vehicles, vehicle, scenario, isDarkMode, ready])
  const discoverCameraKey = JSON.stringify([
    discoverMode,
    discovery?.boundaries?.map((area) => area.key)
  ])
  useEffect(() => {
    if (
      !ready ||
      !mapRef.current ||
      !discovery ||
      (!discovery.places.length && !discovery.boundaries?.length)
    )
      return
    const bounds = new mapboxgl.LngLatBounds()
    if (origin) bounds.extend(origin.coordinates)
    discovery.boundaries?.forEach((area) =>
      area.geometry.coordinates[0].forEach((point) =>
        bounds.extend(point as [number, number])
      )
    )
    mapRef.current.fitBounds(bounds, {
      padding: compact ? 65 : 100,
      maxZoom: 11,
      duration: 0
    })
    // Route enrichment and car changes do not move the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverCameraKey, ready, compact])
  return (
    <div className="buyer-map-wrap">
      <div className="buyer-map-canvas" ref={containerRef} />
      <div className="buyer-map-heading">
        <span className="buyer-live-dot" />
        {activeTrip?.route
          ? `${activeTrip.label} · ${activeTrip.roundTrip ? 'there and back' : 'one way'}${vehicle ? ` · ${vehicleTitle(vehicle)}` : ''}`
          : discovery
            ? discovery.selectedPlace
              ? discovery.selectedPlace.label
              : 'Explore your estimated range'
            : discoverMode
              ? 'Explore from your starting point'
              : 'Your road map'}
        <span>Road view</span>
      </div>
      {discovery && Boolean(discovery.boundaries?.length) && (
        <div className="buyer-map-vehicles" aria-label="Vehicle reach areas">
          {vehicles.map((option, index) => (
            <div
              key={option.car.id}
              data-active={option.car.id === vehicle?.car.id}
            >
              <i style={{ background: vehicleColor(index, isDarkMode) }} />
              <span>{vehicleTitle(option)}</span>
            </div>
          ))}
          <small>Theoretical one-way range · terrain not included</small>
        </div>
      )}
      {(!ready || issue) && (
        <div className="buyer-map-notice">{issue || 'Loading your map…'}</div>
      )}
      {ready && !activeTrip?.route && !discovery && (
        <div className="buyer-map-intro">
          <h2>
            {discoverMode
              ? 'Find a place to visit'
              : 'Add a trip to see the route'}
          </h2>
          <p>
            {discoverMode
              ? 'Add a car and a starting point to draw its estimated range. Then explore places on the map.'
              : 'Add a destination to compare the drive in each car.'}
          </p>
        </div>
      )}
      {(activeTrip?.route || discovery?.selectedPlace?.route) && (
        <div className="buyer-map-key">
          <span>
            <i className="green" />
            Reserve maintained
          </span>
          <span>
            <i className="amber" />
            Using reserve
          </span>
          <span>
            <i className="red" />
            Extra charge needed
          </span>
          <small>
            {vehicle
              ? 'Estimated charge for the active car'
              : 'Select a car to color the route by estimated charge'}
          </small>
        </div>
      )}
    </div>
  )
}
