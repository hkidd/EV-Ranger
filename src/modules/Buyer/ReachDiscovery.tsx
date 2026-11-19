import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'
import { FiInfo, FiList, FiRefreshCw, FiX } from 'react-icons/fi'
import DiscoveryDestination from './DiscoveryDestination'
import {
  fetchReachBoundary,
  fetchRoadRoute,
  fetchRouteElevation,
  findDiscoveryPlaces
} from './buyerApi'
import { originKey, boundaryKey, reachBudget } from './reachModel'
import {
  explorationBounds,
  inExplorationBounds,
  inReach,
  INTERESTS
} from './exploration'
import type {
  DiscoveryPlace,
  DiscoveryResult,
  MapViewport,
  Place,
  Scenario,
  VehicleOption
} from './types'

export default function ReachDiscovery({
  origin,
  vehicles,
  active,
  scenario,
  result,
  onResult,
  onChoose,
  canAdd,
  viewport,
  onSelectPlace
}: {
  origin: Place | null
  vehicles: VehicleOption[]
  active?: VehicleOption
  scenario: Scenario
  result: DiscoveryResult | null
  onResult: Dispatch<SetStateAction<DiscoveryResult | null>>
  onChoose: (place: DiscoveryPlace, roundTrip: boolean) => void
  canAdd: boolean
  viewport: MapViewport | null
  onSelectPlace: (id: string) => void
}) {
  const [categories, setCategories] = useState(
    INTERESTS.map((interest) => interest.id)
  )
  const [scope, setScope] = useState('any')
  const [expanded, setExpanded] = useState<'places' | 'about' | null>(null)
  const [error, setError] = useState('')
  const [boundaryIssue, setBoundaryIssue] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const boundaryCache = useRef(new Map<string, GeoJSON.Polygon>())
  const originIdentity = originKey(origin)
  const boundaryRequestKey = JSON.stringify([
    originIdentity,
    vehicles.map((vehicle) => [vehicle.car.id, reachBudget(vehicle, scenario)])
  ])
  const currentResult = result?.originKey === originIdentity ? result : null
  const validBoundaries =
    currentResult?.boundaries?.filter((area) =>
      vehicles.some(
        (vehicle) =>
          vehicle.car.id === area.vehicleId &&
          area.key === boundaryKey(origin!, vehicle, scenario)
      )
    ) || []
  const scopeValue =
    scope === 'all' || vehicles.some((vehicle) => vehicle.car.id === scope)
      ? scope
      : 'any'
  const scopedBoundaries = validBoundaries.filter(
    (boundary) =>
      scopeValue === 'any' ||
      scopeValue === 'all' ||
      boundary.vehicleId === scopeValue
  )
  const searchBounds = origin
    ? explorationBounds(
        viewport,
        scopedBoundaries.map((boundary) => boundary.geometry),
        origin.coordinates
      )
    : null
  const placeSearchKey = JSON.stringify([
    originIdentity,
    searchBounds,
    categories,
    scopedBoundaries.map((boundary) => boundary.key),
    scopeValue,
    refreshVersion
  ])
  // Serialized request keys represent the exact external inputs; car objects can
  // change identity when only terrain inputs or catalog loading state changes.
  useEffect(() => {
    if (!origin || !vehicles.length) {
      onResult(null)
      return
    }
    const controller = new AbortController()
    const searchId = crypto.randomUUID()
    onResult((previous) => ({
      searchId,
      originKey: originIdentity,
      roundTrip: previous?.roundTrip || false,
      places: [],
      loadingBoundaries: true,
      selectedPlace:
        previous?.originKey === originIdentity
          ? previous.selectedPlace
          : undefined
    }))
    const timer = setTimeout(() => {
      controller.abort()
      setBoundaryIssue('Range areas timed out. Retry to draw them.')
      onResult((previousResult) =>
        previousResult?.searchId === searchId
          ? { ...previousResult, loadingBoundaries: false }
          : previousResult
      )
    }, 20000)
    const geometries = new Map<number, Promise<GeoJSON.Polygon>>()
    const debounce = setTimeout(() => {
      void (async () => {
        const responses = await Promise.allSettled(
          vehicles.map(async (vehicle) => {
            const budget = reachBudget(vehicle, scenario)
            const key = boundaryKey(origin, vehicle, scenario)
            if (budget < 1000) return null
            let geometry = boundaryCache.current.get(key)
            if (!geometry) {
              let request = geometries.get(budget)
              if (!request) {
                request = fetchReachBoundary(
                  origin.coordinates,
                  budget,
                  controller.signal
                )
                geometries.set(budget, request)
              }
              geometry = await request
              if (boundaryCache.current.size >= 20)
                boundaryCache.current.delete(
                  boundaryCache.current.keys().next().value!
                )
              boundaryCache.current.set(key, geometry)
            }
            return { vehicleId: vehicle.car.id, key, geometry }
          })
        )
        if (controller.signal.aborted) return
        const boundaries = responses.flatMap((response) =>
          response.status === 'fulfilled' && response.value
            ? [response.value]
            : []
        )
        setBoundaryIssue(
          responses.some((response) => response.status === 'rejected')
            ? 'Some range areas could not load. Retry to include every car.'
            : ''
        )
        onResult((previous) =>
          previous?.searchId === searchId
            ? { ...previous, boundaries, loadingBoundaries: false }
            : previous
        )
      })().finally(() => clearTimeout(timer))
    }, 450)
    return () => {
      controller.abort()
      clearTimeout(debounce)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryRequestKey, refreshVersion, onResult])
  useEffect(() => {
    const controller = new AbortController()
    let activeRequest = true
    if (!searchBounds || !categories.length) {
      onResult((previousResult) =>
        previousResult
          ? { ...previousResult, places: [], loadingPlaces: false }
          : previousResult
      )
      return
    }
    // Retain matching points while the next viewport loads, avoiding a blank map.
    // Filtering applies immediately; obsolete viewport requests are cancelled.
    onResult((previousResult) =>
      previousResult
        ? {
            ...previousResult,
            places: previousResult.places.filter(
              (place) =>
                inExplorationBounds(place.coordinates, searchBounds) &&
                categories.includes(place.category) &&
                (scopeValue === 'all'
                  ? scopedBoundaries.length === vehicles.length &&
                    scopedBoundaries.every((area) =>
                      inReach(place.coordinates, area.geometry)
                    )
                  : scopedBoundaries.some((area) =>
                      inReach(place.coordinates, area.geometry)
                    ))
            ),
            loadingPlaces: true,
            searchPartial: false,
            searchRateLimited: false,
            truncated: false
          }
        : previousResult
    )
    const debounce = setTimeout(() => {
      const timer = setTimeout(
        () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
        40000
      )
      setError('')
      void findDiscoveryPlaces(searchBounds, categories, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return
          const places = data.places.filter((place) =>
            scopeValue === 'all'
              ? scopedBoundaries.length === vehicles.length &&
                scopedBoundaries.every((boundary) =>
                  inReach(place.coordinates, boundary.geometry)
                )
              : scopedBoundaries.some((boundary) =>
                  inReach(place.coordinates, boundary.geometry)
                )
          )
          onResult((previousResult) =>
            previousResult?.originKey === originIdentity
              ? {
                  ...previousResult,
                  places,
                  loadingPlaces: false,
                  searchPartial: data.partial,
                  searchRateLimited: data.rateLimited,
                  truncated: data.truncated
                }
              : previousResult
          )
        })
        .catch((e) => {
          if (!activeRequest) return
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : 'Places could not load.')
          else if (
            !controller.signal.reason ||
            controller.signal.reason.name === 'TimeoutError'
          )
            setError('Place search timed out. Retry or zoom closer.')
        })
        .finally(() => {
          clearTimeout(timer)
          if (
            activeRequest &&
            (!controller.signal.aborted ||
              controller.signal.reason?.name === 'TimeoutError')
          )
            onResult((previousResult) =>
              previousResult
                ? { ...previousResult, loadingPlaces: false }
                : previousResult
            )
        })
    }, 600)
    return () => {
      activeRequest = false
      controller.abort()
      clearTimeout(debounce)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSearchKey, onResult])
  const selected = currentResult?.selectedPlace
  const routeKey = JSON.stringify([
    originIdentity,
    selected?.id,
    currentResult?.roundTrip,
    refreshVersion
  ])
  useEffect(() => {
    if (!selected || !origin) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
      update({
        error: 'The route check timed out. Retry to check this destination.'
      })
    }, 25000)
    const id = selected.id
    const roundTrip = currentResult?.roundTrip || false
    onResult((previousResult) =>
      previousResult?.selectedPlace?.id === id
        ? {
            ...previousResult,
            selectedPlace: {
              ...previousResult.selectedPlace,
              route: undefined,
              error: undefined
            }
          }
        : previousResult
    )
    const update = (value: Partial<DiscoveryPlace>) =>
      onResult((previousResult) =>
        previousResult?.originKey === originIdentity &&
        previousResult.selectedPlace?.id === id
          ? {
              ...previousResult,
              selectedPlace: { ...previousResult.selectedPlace, ...value }
            }
          : previousResult
      )
    void fetchRoadRoute(
      origin.coordinates,
      selected.coordinates,
      roundTrip,
      controller.signal
    )
      .then(async (route) => {
        if (controller.signal.aborted) return
        update({ route })
        try {
          const elevation = await fetchRouteElevation(
            origin.coordinates,
            selected.coordinates,
            roundTrip,
            controller.signal
          )
          if (!controller.signal.aborted)
            update({ route: { ...route, elevation } })
        } catch {
          /* Keep the road-based estimate. */
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          update({
            error: e instanceof Error ? e.message : 'Route unavailable.'
          })
      })
      .finally(() => clearTimeout(timer))
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, onResult])
  return (
    <>
      <section
        className="buyer-discovery buyer-explore"
        aria-labelledby="explore-title"
      >
        <div className="buyer-explore-controls">
          <h2 id="explore-title">Places to visit</h2>
          <div
            className="buyer-interest-filters"
            role="group"
            aria-label="Places you are interested in"
          >
            {INTERESTS.map((interest) => (
              <button
                key={interest.id}
                aria-pressed={categories.includes(interest.id)}
                onClick={() =>
                  setCategories((previous) =>
                    previous.includes(interest.id)
                      ? previous.filter(
                          (categoryId) => categoryId !== interest.id
                        )
                      : [...previous, interest.id]
                  )
                }
              >
                <i aria-hidden="true" style={{ background: interest.color }} />
                {interest.id === 'parks' ? 'Outdoors' : interest.label}
              </button>
            ))}
          </div>
          <label className="buyer-explore-scope">
            <span>Within range of</span>
            <select
              value={scopeValue}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="any">Any car</option>
              <option value="all">Every car</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.car.id} value={vehicle.car.id}>
                  {vehicle.car.brand} {vehicle.car.model}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="buyer-explore-footer">
          <div className="buyer-explore-status" role="status">
            <span>
              {!origin
                ? 'Choose a starting point to explore.'
                : !active
                  ? 'Add a car to see its range.'
                  : scenario.charge <= scenario.reserve
                    ? 'Starting charge must exceed reserve.'
                    : currentResult?.loadingBoundaries
                      ? 'Drawing your range…'
                      : currentResult?.loadingPlaces
                        ? 'Finding places…'
                        : !categories.length
                          ? 'Choose an interest.'
                          : !scopedBoundaries.length
                            ? 'No range area available.'
                            : !searchBounds
                              ? 'Move into a range area to see places.'
                              : `${currentResult?.places.length || 0} places in view`}
            </span>
            {currentResult?.searchPartial && (
              <span className="buyer-explore-partial">
                {currentResult.searchRateLimited
                  ? 'Search temporarily limited'
                  : 'Partial results'}
              </span>
            )}
            {currentResult?.truncated && <span>Zoom closer for more</span>}
          </div>
          <div className="buyer-explore-actions">
            <button
              type="button"
              aria-expanded={expanded === 'places'}
              aria-controls="buyer-explore-list"
              disabled={!currentResult?.places.length}
              onClick={() =>
                setExpanded((value) => (value === 'places' ? null : 'places'))
              }
            >
              <FiList aria-hidden="true" />
              List
            </button>
            <button
              type="button"
              aria-expanded={expanded === 'about'}
              aria-controls="buyer-explore-about"
              onClick={() =>
                setExpanded((value) => (value === 'about' ? null : 'about'))
              }
            >
              <FiInfo aria-hidden="true" />
              About
            </button>
            <button
              type="button"
              onClick={() => setRefreshVersion((value) => value + 1)}
              disabled={!origin || !active}
              aria-label="Refresh places and range areas"
            >
              <FiRefreshCw aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        {(error || boundaryIssue) && (
          <p className="buyer-inline-error" role="status">
            {error || boundaryIssue}
          </p>
        )}
        <div
          id="buyer-explore-about"
          hidden={expanded !== 'about'}
          className="buyer-explore-notes"
        >
          <p>
            Pan or zoom to discover places inside your cars’ shaded range areas.
            Select a dot to check its road route, or open the list to browse by
            name.
          </p>
          <p>
            The outlines are approximate one-way range estimates using your
            charge, reserve, temperature and EPA reference. Terrain is included
            only in detailed trip checks when the necessary inputs are
            available.
          </p>
          <p>
            Places come from TomTom’s directory. Results are not exhaustive;
            zoom closer for more detail. Partial results mean some areas could
            not be searched—refresh to retry.
          </p>
        </div>
        <div
          id="buyer-explore-list"
          hidden={expanded !== 'places'}
          className="buyer-place-browser"
        >
          <div className="buyer-place-browser-heading">
            <span>Places in this view</span>
            <button
              type="button"
              aria-label="Close place list"
              onClick={() => setExpanded(null)}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
          <ul>
            {currentResult?.places.map((place) => (
              <li key={place.id}>
                <button
                  aria-pressed={selected?.id === place.id}
                  onClick={() => onSelectPlace(place.id)}
                >
                  <i
                    aria-hidden="true"
                    style={{
                      background: INTERESTS.find(
                        (interest) => interest.id === place.category
                      )?.color
                    }}
                  />
                  <span>
                    {place.label}
                    <small>{place.address}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {selected && (
        <section
          className="buyer-discovery-results buyer-selected-place"
          aria-label="Selected destination"
        >
          <div className="buyer-heading-row">
            <h2>{selected.label}</h2>
            <button
              className="buyer-text-button"
              onClick={() =>
                onResult((previousResult) =>
                  previousResult
                    ? { ...previousResult, selectedPlace: undefined }
                    : previousResult
                )
              }
            >
              Close destination
            </button>
          </div>
          <label className="buyer-explore-journey">
            Check this journey
            <select
              value={String(currentResult?.roundTrip || false)}
              onChange={(e) =>
                onResult((previousResult) =>
                  previousResult
                    ? {
                        ...previousResult,
                        roundTrip: e.target.value === 'true',
                        selectedPlace: previousResult.selectedPlace
                          ? {
                              ...previousResult.selectedPlace,
                              route: undefined,
                              error: undefined
                            }
                          : undefined
                      }
                    : previousResult
                )
              }
            >
              <option value="false">One way</option>
              <option value="true">There & back</option>
            </select>
          </label>
          <ul className="buyer-discovery-list">
            <DiscoveryDestination
              place={selected}
              index={0}
              vehicles={vehicles}
              active={active}
              scenario={scenario}
              roundTrip={currentResult?.roundTrip || false}
              canAdd={canAdd}
              onChoose={onChoose}
            />
          </ul>
          <p className="buyer-tiny">
            The shaded area stays one way. This destination’s road check uses
            the journey selected above. Places and range: TomTom. Roads: Mapbox.
          </p>
        </section>
      )}
    </>
  )
}
