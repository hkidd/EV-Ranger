import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowRight,
  FiArrowUp,
  FiArrowUpRight,
  FiChevronDown,
  FiPlus,
  FiX,
  FiCheck,
  FiNavigation
} from 'react-icons/fi'
import RangerHeader from './RangerHeader'
import RangerFooter from './RangerFooter'
import FirstUseGuide from './FirstUseGuide'
import { readGuide, saveGuide, type GuideStage } from './guideState'
import VehicleRail from './VehicleRail'
import RouteTerrain from './RouteTerrain'
import RouteWeather from './RouteWeather'
import ResponsiveDisclosure from './ResponsiveDisclosure'
import ReachDiscovery from './ReachDiscovery'
import { originKey } from './reachModel'
import VehicleConfiguration from './VehicleConfiguration'
import { groupVehicleFamilies } from './vehicleFamilies'
import type { CarVariant } from '../../types'
import ScenarioSlider from './ScenarioSlider'
import { useCarsQuery } from '../../queries/carQuery'
import PlaceSearch from './PlaceSearch'
import { fetchRoadRoute, fetchRouteElevation } from './buyerApi'
import {
  durationText,
  estimateFit,
  fullRange,
  MILES_TO_METERS,
  vehicleTitle
} from './estimates'
import type {
  LifeTrip,
  Place,
  Scenario,
  VehicleOption,
  TerrainInputs,
  ElevationProfile,
  DiscoveryResult,
  DiscoveryPlace,
  MapViewport
} from './types'
import {
  DEFAULT_SCENARIO,
  emptyWorkspace,
  readWorkspace,
  reconcileWorkspace,
  saveWorkspace
} from './workspaceStorage'
import './buyer.css'
const BuyerMap = lazy(() => import('./BuyerMap'))
const NO_TRIPS: LifeTrip[] = []
const unavailableTerrain = (): ElevationProfile => ({
  status: 'unavailable',
  source: 'USGS 3DEP',
  sampleSpacingMeters: 0,
  samples: [],
  ascentMeters: null,
  descentMeters: null
})
const statusLabel = {
  'reserve-met': 'Reserve met',
  'below-reserve': 'Below reserve',
  'needs-charge': 'Extra charge needed'
}

export default function BuyerWorkspace() {
  const [stored] = useState(readWorkspace)
  const [guideStage, setGuideStage] = useState<GuideStage>(readGuide)
  const [saveAvailable, setSaveAvailable] = useState(stored.available)
  const [workspaceKey, setWorkspaceKey] = useState(0)
  const [origin, setOrigin] = useState<Place | null>(stored.snapshot.origin)
  const [destination, setDestination] = useState<Place | null>(null)
  const [tripLabel, setTripLabel] = useState('')
  const [composerOpen, setComposerOpen] = useState(
    stored.snapshot.trips.length === 0
  )
  const [trips, setTrips] = useState<LifeTrip[]>(stored.snapshot.trips)
  const [pickerKey, setPickerKey] = useState(0)
  const [configurations, setConfigurations] = useState<Record<string, string>>(
    stored.snapshot.configurations
  )
  const [terrainInputs, setTerrainInputs] = useState<
    Record<string, TerrainInputs>
  >(stored.snapshot.terrainInputs)
  const [shortlist, setShortlist] = useState<string[]>(
    stored.snapshot.shortlist
  )
  const [activeVehicle, setActiveVehicle] = useState(
    stored.snapshot.activeVehicle
  )
  const [activeTripId, setActiveTripId] = useState(stored.snapshot.activeTripId)
  const [query, setQuery] = useState('')
  const [make, setMake] = useState('all')
  const [year, setYear] = useState('recent')
  const [limit, setLimit] = useState(18)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const {
    data: catalog,
    isLoading,
    isError,
    isPlaceholderData,
    availableYears,
    recentYears,
    refetch
  } = useCarsQuery(year, shortlist)
  const [scenario, setScenario] = useState<Scenario>(stored.snapshot.scenario)
  const [notice, setNotice] = useState('')
  const [locating, setLocating] = useState(false)
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null)
  const [exploreViewport, setExploreViewport] = useState<MapViewport | null>(
    null
  )
  const [mapMode, setMapMode] = useState<'trips' | 'discover'>('discover')
  const routeRequestRef = useRef<AbortController | null>(null)
  const routeRequestIdRef = useRef(0)
  const conditionsRef = useRef<HTMLDetailsElement>(null)
  useEffect(() => () => routeRequestRef.current?.abort(), [])
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      const panel = conditionsRef.current
      if (
        panel?.open &&
        event.target instanceof Node &&
        !panel.contains(event.target)
      )
        panel.open = false
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [])
  function closeConditions() {
    if (!conditionsRef.current) return
    conditionsRef.current.open = false
    conditionsRef.current
      .querySelector('summary')
      ?.focus({ preventScroll: true })
  }
  const options = useMemo<VehicleOption[]>(
    () =>
      (catalog ? groupVehicleFamilies(catalog.cars) : []).flatMap((car) =>
        car.variants.map((variant) => ({
          car,
          variant,
          terrain: terrainInputs[variant.id]
        }))
      ),
    [catalog, terrainInputs]
  )
  const selected = useMemo(
    () =>
      shortlist
        .map((id) => options.find((option) => option.variant.id === id))
        .filter((value): value is VehicleOption => Boolean(value)),
    [shortlist, options]
  )
  const snapshot = useMemo(
    () => ({
      version: 1 as const,
      origin,
      trips,
      shortlist,
      configurations,
      terrainInputs,
      activeVehicle,
      activeTripId,
      scenario
    }),
    [
      origin,
      trips,
      shortlist,
      configurations,
      terrainInputs,
      activeVehicle,
      activeTripId,
      scenario
    ]
  )
  const reconciled = useMemo(
    () => (catalog ? reconcileWorkspace(snapshot, options) : snapshot),
    [catalog, snapshot, options]
  )
  useEffect(() => {
    if (!catalog || isPlaceholderData) return
    if (JSON.stringify(shortlist) !== JSON.stringify(reconciled.shortlist)) {
      setShortlist(reconciled.shortlist)
      setActiveVehicle(reconciled.activeVehicle)
      setNotice(
        'Some saved cars are no longer in the catalog. Your trips and settings are still here.'
      )
    }
    if (
      JSON.stringify(configurations) !==
      JSON.stringify(reconciled.configurations)
    )
      setConfigurations(reconciled.configurations)
  }, [catalog, isPlaceholderData, shortlist, configurations, reconciled])
  useEffect(() => {
    if (!isPlaceholderData) setSaveAvailable(saveWorkspace(reconciled))
  }, [reconciled, isPlaceholderData])
  const makes = useMemo(
    () => [...new Set(options.map((option) => option.car.brand))].sort(),
    [options]
  )
  const years = availableYears
  const filtered = useMemo(
    () =>
      options
        .filter(
          (option) =>
            (make === 'all' || option.car.brand === make) &&
            (year === 'all' ||
              (year === 'recent'
                ? recentYears.includes(option.car.modelYear ?? 0)
                : option.car.modelYear === Number(year))) &&
            `${vehicleTitle(option)} ${option.car.variants.map((variant) => variant.name).join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase().trim())
        )
        .filter((option, _, all) => {
          const chosen =
            shortlist.find((id) =>
              option.car.variants.some((variant) => variant.id === id)
            ) ?? configurations[option.car.id]
          return (
            option.variant.id ===
            (chosen ??
              all.find((candidate) => candidate.car.id === option.car.id)
                ?.variant.id)
          )
        }),
    [options, make, year, query, shortlist, configurations, recentYears]
  )
  const readyTrips = trips.filter(
    (trip) => trip.status === 'ready' && trip.route
  )
  const activeTrip =
    mapMode === 'trips'
      ? (trips.find((trip) => trip.id === activeTripId) ??
        readyTrips[0] ??
        trips[0])
      : undefined
  const activeCar =
    selected.find((option) => option.variant.id === activeVehicle) ??
    selected[0]
  const mapDiscovery =
    discovery?.originKey === originKey(origin) ? discovery : null
  function selectDiscoveryPlace(id: string) {
    setDiscovery((previous) => {
      const place = previous?.places.find((place) => place.id === id)
      return previous && place
        ? { ...previous, selectedPlace: place }
        : previous
    })
  }
  const activeFit =
    activeCar && activeTrip?.route
      ? estimateFit(activeCar, activeTrip.route, scenario)
      : null
  const routing = trips.some((trip) => trip.status === 'loading')
  const routeFingerprint = trips
    .map((trip) => `${trip.id}:${trip.roundTrip}`)
    .join('|')
  useEffect(() => {
    setLimit(18)
  }, [query, make, year])
  function goToSection(id: string) {
    if (id === 'buyer-catalog') setCatalogOpen(true)
    requestAnimationFrame(() => {
      const section = document.getElementById(id)
      section?.scrollIntoView({ block: 'start' })
      section?.focus({ preventScroll: true })
    })
  }
  function changeGuide(stage: GuideStage) {
    setGuideStage(stage)
    saveGuide(stage)
  }
  function setHome(place: Place | null) {
    routeRequestRef.current?.abort()
    routeRequestIdRef.current++
    const nextTrips = trips.map((trip): LifeTrip => ({
      ...trip,
      status: 'idle',
      route: null,
      error: undefined
    }))
    setOrigin(place)
    setNotice('')
    setTrips(nextTrips)
    if (place && nextTrips.length) void mapPlaces(nextTrips, place)
  }
  function invalidateTrip(id: string, remove = false) {
    routeRequestRef.current?.abort()
    routeRequestIdRef.current++
    const nextTrips = trips
      .filter((trip) => !remove || trip.id !== id)
      .map((trip): LifeTrip => ({
        ...trip,
        ...(trip.id === id
          ? { roundTrip: !trip.roundTrip, route: null, status: 'idle' }
          : trip.status === 'loading'
            ? { status: 'idle' }
            : {}),
        error: undefined
      }))
    setTrips(nextTrips)
    if (origin && nextTrips.length) void mapPlaces(nextTrips)
  }
  function chooseDiscoveryPlace(place: DiscoveryPlace, roundTrip: boolean) {
    if (!origin || trips.length >= 5 || !place.route) return
    const trip: LifeTrip = {
      id: crypto.randomUUID(),
      label: place.label,
      place,
      roundTrip,
      // Discovery continues enriching its own route. Keep the saved trip immutable.
      route: { ...place.route },
      status: 'ready'
    }
    setTrips((previous) => [...previous, trip])
    setActiveTripId(trip.id)
    setMapMode('trips')
    goToSection('buyer-road-view')
    if (!trip.route!.elevation) {
      // Terrain may still be loading when a discovery result is saved as a trip.
      const controller =
        routeRequestRef.current && !routeRequestRef.current.signal.aborted
          ? routeRequestRef.current
          : new AbortController()
      routeRequestRef.current = controller
      const current = routeRequestIdRef.current
      void fetchRouteElevation(
        origin.coordinates,
        place.coordinates,
        roundTrip,
        controller.signal
      )
        .catch(unavailableTerrain)
        .then((elevation) => {
          if (
            current !== routeRequestIdRef.current ||
            controller.signal.aborted
          )
            return
          setTrips((previous) =>
            previous.map((item) =>
              item.id === trip.id && item.route
                ? { ...item, route: { ...item.route, elevation } }
                : item
            )
          )
        })
    }
  }
  function addTrip() {
    if (!destination || trips.length >= 5) return
    const trip: LifeTrip = {
      id: crypto.randomUUID(),
      label: tripLabel.trim() || destination.label.split(',')[0] || 'My place',
      place: destination,
      roundTrip: true,
      route: null,
      status: 'idle'
    }
    setTrips((previous) => [...previous, trip])
    setActiveTripId(trip.id)
    setDestination(null)
    setTripLabel('')
    setComposerOpen(false)
    setPickerKey((previous) => previous + 1)
    setNotice('')
    if (origin) void mapPlaces([...trips, trip])
  }
  async function mapPlaces(routeTrips = trips, from = origin) {
    if (!from || !routeTrips.length) return
    routeRequestRef.current?.abort()
    const controller = new AbortController()
    routeRequestRef.current = controller
    const current = ++routeRequestIdRef.current
    const deadline = setTimeout(() => controller.abort(), 25000)
    setNotice('')
    setTrips(
      routeTrips.map((trip) => ({
        ...trip,
        status: 'loading',
        route: null,
        error: undefined
      }))
    )
    await Promise.all(
      routeTrips.map(async (trip) => {
        try {
          const route = await fetchRoadRoute(
            from.coordinates,
            trip.place.coordinates,
            trip.roundTrip,
            controller.signal
          )
          if (
            current === routeRequestIdRef.current &&
            !controller.signal.aborted
          )
            setTrips((previous) =>
              previous.map((item) =>
                item.id === trip.id ? { ...item, status: 'ready', route } : item
              )
            )
          if (
            current === routeRequestIdRef.current &&
            !controller.signal.aborted
          ) {
            void fetchRouteElevation(
              from.coordinates,
              trip.place.coordinates,
              trip.roundTrip,
              controller.signal
            )
              .catch(unavailableTerrain)
              .then((elevation) => {
                if (
                  current !== routeRequestIdRef.current ||
                  controller.signal.aborted
                )
                  return
                setTrips((previous) =>
                  previous.map((item) =>
                    item.id === trip.id && item.route
                      ? { ...item, route: { ...item.route, elevation } }
                      : item
                  )
                )
              })
          }
        } catch (error) {
          if (current === routeRequestIdRef.current)
            setTrips((previous) =>
              previous.map((item) =>
                item.id === trip.id
                  ? {
                      ...item,
                      status: 'error',
                      error: controller.signal.aborted
                        ? 'The route request timed out. Please try again.'
                        : error instanceof Error
                          ? error.message
                          : 'Route unavailable.'
                    }
                  : item
              )
            )
        }
      })
    )
    clearTimeout(deadline)
    if (current === routeRequestIdRef.current)
      setTrips((previous) =>
        previous.map((trip) =>
          trip.status === 'loading'
            ? {
                ...trip,
                status: 'error',
                error: 'The route request timed out. Please try again.'
              }
            : trip
        )
      )
  }
  const restoreRoutes = useRef(() => {})
  restoreRoutes.current = () => {
    if (stored.snapshot.origin && stored.snapshot.trips.length)
      void mapPlaces(stored.snapshot.trips, stored.snapshot.origin)
  }
  useEffect(() => {
    restoreRoutes.current()
  }, [])
  function startFresh() {
    routeRequestRef.current?.abort()
    routeRequestIdRef.current++
    setOrigin(null)
    setDiscovery(null)
    setMapMode('discover')
    setDestination(null)
    setTrips([])
    setShortlist([])
    setConfigurations({})
    setTerrainInputs({})
    setActiveVehicle('')
    setActiveTripId('')
    setScenario({ ...DEFAULT_SCENARIO })
    setTripLabel('')
    setComposerOpen(true)
    setCatalogOpen(false)
    setQuery('')
    setMake('all')
    setYear('recent')
    setWorkspaceKey((previous) => previous + 1)
    setPickerKey((previous) => previous + 1)
    setSaveAvailable(saveWorkspace(emptyWorkspace()))
    setNotice('Fresh start. Your saved cars and places have been cleared.')
  }
  function toggleCar(option: VehicleOption) {
    const id = option.variant.id
    if (shortlist.includes(id)) {
      setShortlist((previous) => previous.filter((value) => value !== id))
      return
    }
    if (shortlist.length >= 3) {
      setNotice(
        'You can compare three cars at a time. Remove one to add another.'
      )
      return
    }
    setShortlist((previous) => [...previous, id])
    setActiveVehicle(id)
    setNotice('')
  }
  function configureCar(option: VehicleOption, variant: CarVariant) {
    setConfigurations((previous) => ({
      ...previous,
      [option.car.id]: variant.id
    }))
    setShortlist((previous) =>
      previous.map((id) =>
        option.car.variants.some((candidate) => candidate.id === id)
          ? variant.id
          : id
      )
    )
    if (activeCar?.car.id === option.car.id) setActiveVehicle(variant.id)
  }
  function suggestCars() {
    const visibleCars = new Set(filtered.map((option) => option.car.id))
    const candidates = options
      .filter((option) => visibleCars.has(option.car.id))
      .sort((a, b) => {
        if (!readyTrips.length)
          return fullRange(b, scenario).range - fullRange(a, scenario).range
        const score = (option: VehicleOption) =>
          readyTrips.map((trip) => estimateFit(option, trip.route!, scenario))
        const af = score(a)
        const bf = score(b)
        return (
          bf.filter((fit) => fit.status === 'reserve-met').length -
            af.filter((fit) => fit.status === 'reserve-met').length ||
          Math.min(...bf.map((fit) => fit.margin)) -
            Math.min(...af.map((fit) => fit.margin))
        )
      })
    const brands = new Set<string>()
    const picks: string[] = []
    for (const option of candidates) {
      if (brands.has(option.car.brand)) continue
      brands.add(option.car.brand)
      picks.push(option.variant.id)
      if (picks.length === 3) break
    }
    setShortlist(picks)
    setActiveVehicle(picks[0] ?? '')
    setNotice(
      'Suggestions prioritize estimated range margin, with one configuration per make. Price, retail availability, charging, and ownership costs are not ranked.'
    )
  }
  function useLocation() {
    if (!navigator.geolocation) {
      setNotice(
        'Location access is unavailable. Search for a starting point instead.'
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHome({
          id: 'current-location',
          label: 'Current location',
          coordinates: [position.coords.longitude, position.coords.latitude]
        })
        setLocating(false)
      },
      () => {
        setNotice(
          'Could not access your location. You can search for a starting point instead.'
        )
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }
  return (
    <main className="buyer-app">
      <a
        className="buyer-skip"
        href="#buyer-shortlist"
        onClick={(event) => {
          event.preventDefault()
          goToSection('buyer-shortlist')
        }}
      >
        Skip to comparison
      </a>
      <RangerHeader
        count={selected.length}
        onCars={() => goToSection('buyer-shortlist')}
      />
      <h1 className="sr-only">Compare electric cars</h1>
      {guideStage !== 'dismissed' && guideStage !== 'complete' && (
        <FirstUseGuide
          step={guideStage}
          onChange={changeGuide}
          onFinish={() => {
            changeGuide('complete')
            setMapMode('discover')
            goToSection(selected.length ? 'buyer-road-view' : 'buyer-catalog')
          }}
        />
      )}
      {notice && (
        <div className="buyer-notice" role="status">
          <span>{notice}</span>
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>
            <FiX aria-hidden="true" />
          </button>
        </div>
      )}
      <section className="buyer-workspace" data-map-mode={mapMode}>
        <aside className="buyer-setup">
          <div className="buyer-section-heading">
            <h2>
              {mapMode === 'discover' ? 'Explore from here' : 'Your trips'}
            </h2>
          </div>
          <div className="buyer-origin-row">
            <PlaceSearch
              key={workspaceKey}
              label="Starting point"
              placeholder="Town, ZIP code, or address"
              value={origin}
              onChange={setHome}
            />
            <button
              className="buyer-location-button"
              onClick={useLocation}
              disabled={locating}
              aria-label={
                locating ? 'Finding your location' : 'Use my current location'
              }
            >
              <FiNavigation aria-hidden="true" />
              <span>
                {locating
                  ? 'Finding your location…'
                  : 'Use my current location'}
              </span>
            </button>
          </div>
          {mapMode === 'trips' && (
            <ResponsiveDisclosure
              className="buyer-saved-places"
              initialOpen={!trips.length}
              title={
                <>
                  <span>
                    {trips.length ? 'Saved trips' : 'Add a destination'}
                  </span>
                  <span>
                    {trips.length ? `${trips.length} saved` : 'Optional'}
                  </span>
                </>
              }
            >
              <div className="buyer-trip-list">
                {trips.map((trip, index) => (
                  <div
                    key={trip.id}
                    className={`buyer-trip${activeTrip?.id === trip.id ? ' active' : ''}`}
                  >
                    <button
                      className="buyer-trip-select"
                      aria-pressed={activeTrip?.id === trip.id}
                      onClick={() => setActiveTripId(trip.id)}
                    >
                      <span className="buyer-place-number">{index + 1}</span>
                      <span>
                        <strong>{trip.label}</strong>
                        <small>{trip.place.label}</small>
                      </span>
                      <span className="buyer-trip-distance">
                        {trip.route
                          ? `${Math.round(trip.route.distance / MILES_TO_METERS)} mi`
                          : trip.status === 'loading'
                            ? '…'
                            : '—'}
                      </span>
                    </button>
                    <div className="buyer-trip-controls">
                      <div
                        className="buyer-journey-switch"
                        role="group"
                        aria-label={`Journey type for ${trip.label}`}
                        data-return={trip.roundTrip}
                      >
                        <button
                          aria-pressed={!trip.roundTrip}
                          onClick={() => {
                            if (trip.roundTrip) invalidateTrip(trip.id)
                          }}
                        >
                          One way
                        </button>
                        <button
                          aria-pressed={trip.roundTrip}
                          onClick={() => {
                            if (!trip.roundTrip) invalidateTrip(trip.id)
                          }}
                        >
                          There & back
                        </button>
                      </div>
                      <button
                        aria-label={`Remove ${trip.label}`}
                        onClick={() => invalidateTrip(trip.id, true)}
                      >
                        Remove
                      </button>
                    </div>
                    {trip.error && (
                      <p role="status" className="buyer-inline-error">
                        {trip.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {trips.length < 5 && (
                <details
                  className="buyer-add-place"
                  open={composerOpen}
                  onToggle={(event) =>
                    setComposerOpen(event.currentTarget.open)
                  }
                >
                  <summary>
                    {trips.length ? 'Add another place' : 'Add a place'}
                  </summary>
                  <PlaceSearch
                    key={pickerKey}
                    label="A place you go"
                    placeholder="Where do you go?"
                    value={destination}
                    onChange={setDestination}
                    proximity={origin?.coordinates}
                  />
                  <details className="buyer-place-label-row">
                    <summary>Name this place</summary>
                    <label htmlFor="trip-label">Place name</label>
                    <input
                      id="trip-label"
                      maxLength={40}
                      value={tripLabel}
                      onChange={(event) => setTripLabel(event.target.value)}
                      placeholder="Work, family, weekends…"
                    />
                  </details>
                  <button
                    className="buyer-add-button"
                    onClick={addTrip}
                    disabled={!destination}
                  >
                    <FiPlus aria-hidden="true" /> Add this place
                  </button>
                </details>
              )}
              {routing && (
                <p className="buyer-routing-state" role="status">
                  <span className="buyer-spinner" aria-hidden="true" />{' '}
                  Following the roads…
                </p>
              )}
              {!routing &&
                trips.length > 0 &&
                readyTrips.length !== trips.length && (
                  <button
                    className="buyer-primary"
                    onClick={() => void mapPlaces()}
                    disabled={!origin}
                  >
                    Retry road routes <FiArrowUpRight aria-hidden="true" />
                  </button>
                )}
            </ResponsiveDisclosure>
          )}
          <details
            ref={conditionsRef}
            className="buyer-assumptions"
            id="buyer-assumptions"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                closeConditions()
              }
            }}
          >
            <summary>
              Conditions{' '}
              <span>
                {scenario.charge}% start · {scenario.reserve}% reserve ·{' '}
                {scenario.temperature}°F
              </span>
            </summary>
            <div className="buyer-assumptions-body">
              <div className="buyer-assumptions-header">
                <div>
                  <h3>Conditions</h3>
                  <p>Shared across your cars.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close conditions"
                  onClick={closeConditions}
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
              {activeFit && (
                <p className="buyer-assumption-result">
                  <strong>
                    {activeCar.car.brand} {activeCar.car.model}
                  </strong>
                  <span className={activeFit.status}>
                    {activeFit.status === 'needs-charge'
                      ? 'Extra charge needed'
                      : `${Math.round(activeFit.arrival)}% estimated arrival`}
                  </span>
                </p>
              )}
              <div className="buyer-charge-settings">
                <ScenarioSlider
                  label="Starting charge"
                  value={scenario.charge}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(value) =>
                    setScenario((previous) => ({ ...previous, charge: value }))
                  }
                />
                <ScenarioSlider
                  label="Reserve"
                  value={scenario.reserve}
                  min={0}
                  max={40}
                  unit="%"
                  onChange={(value) =>
                    setScenario((previous) => ({ ...previous, reserve: value }))
                  }
                />
              </div>
              <ScenarioSlider
                label="Outside temperature"
                value={scenario.temperature}
                min={-20}
                max={120}
                unit="°F"
                onChange={(value) =>
                  setScenario((previous) => ({
                    ...previous,
                    temperature: value
                  }))
                }
              />
              <div
                className="buyer-weather-presets"
                role="group"
                aria-label="Temperature presets"
              >
                <button
                  aria-pressed={scenario.temperature === 70}
                  onClick={() =>
                    setScenario((previous) => ({
                      ...previous,
                      temperature: 70
                    }))
                  }
                >
                  Mild · 70°F
                </button>
                <button
                  aria-pressed={scenario.temperature === 32}
                  onClick={() =>
                    setScenario((previous) => ({
                      ...previous,
                      temperature: 32
                    }))
                  }
                >
                  Cold · 32°F
                </button>
              </div>
              <label className="buyer-basis-label">
                Range reference
                <select
                  value={scenario.basis}
                  onChange={(event) =>
                    setScenario((previous) => ({
                      ...previous,
                      basis: event.target.value as Scenario['basis']
                    }))
                  }
                >
                  <option value="highway">EPA highway, where available</option>
                  <option value="combined">EPA combined</option>
                  <option value="city">EPA city, where available</option>
                </select>
              </label>
              <p className="buyer-tiny">
                Reserve is charge kept for arrival. Temperature effects are a
                general estimate.
              </p>
              {scenario.reserve > scenario.charge && (
                <p className="buyer-inline-error">
                  Starting charge is below your reserve.
                </p>
              )}
            </div>
          </details>
        </aside>
        <div className="buyer-road-panel">
          <div
            id="buyer-road-view"
            tabIndex={-1}
            className="buyer-map-modes"
            role="group"
            aria-label="Map view"
          >
            <button
              aria-pressed={mapMode === 'discover'}
              onClick={() => setMapMode('discover')}
            >
              Explore
            </button>
            <button
              aria-pressed={mapMode === 'trips'}
              onClick={() => setMapMode('trips')}
            >
              Trips
            </button>
            <button
              className="buyer-find-car-button"
              onClick={() => goToSection('buyer-catalog')}
            >
              Find a car <FiPlus aria-hidden="true" />
            </button>
          </div>
          <Suspense
            fallback={
              <div className="buyer-map-loading">Preparing your road view…</div>
            }
          >
            <BuyerMap
              origin={origin}
              trips={mapMode === 'trips' ? trips : NO_TRIPS}
              discoverMode={mapMode === 'discover'}
              activeTrip={mapMode === 'trips' ? activeTrip : undefined}
              discovery={mapMode === 'discover' ? mapDiscovery : null}
              vehicle={activeCar}
              vehicles={selected}
              scenario={scenario}
              onSelectTrip={setActiveTripId}
              onViewport={setExploreViewport}
              onSelectPlace={selectDiscoveryPlace}
            />
          </Suspense>
          {mapMode === 'discover' && (
            <ReachDiscovery
              origin={origin}
              vehicles={selected}
              active={activeCar}
              scenario={scenario}
              result={discovery}
              onResult={setDiscovery}
              onChoose={chooseDiscoveryPlace}
              canAdd={trips.length < 5}
              viewport={exploreViewport}
              onSelectPlace={selectDiscoveryPlace}
            />
          )}
          <RouteWeather
            origin={origin}
            route={
              mapMode === 'trips' ? activeTrip?.route || undefined : undefined
            }
            temperature={scenario.temperature}
            onApply={(temperature) =>
              setScenario((previous) => ({ ...previous, temperature }))
            }
          />
          <div
            className={`buyer-route-summary${activeTrip?.route ? '' : ' empty'}`}
            aria-live="polite"
          >
            <div>
              <h2>
                {activeTrip?.route
                  ? `${Math.round(activeTrip.route.distance / MILES_TO_METERS)} miles to ${activeTrip.roundTrip ? 'get there and back' : 'get there'}`
                  : 'Where would you like to go?'}
              </h2>
              <p>
                {activeTrip?.route
                  ? `${durationText(activeTrip.route.duration)} driving · ${activeTrip.label} · Mapbox road route`
                  : 'Add your starting point and a destination to trace a road route.'}
              </p>
            </div>
          </div>
          <section
            id="buyer-shortlist"
            className="buyer-shortlist"
            tabIndex={-1}
          >
            <div className="buyer-heading-row">
              <div>
                <h2>
                  Cars{' '}
                  <span className="buyer-count">{selected.length} / 3</span>
                </h2>
                <p>
                  {activeTrip?.route
                    ? `Comparing ${activeTrip.label} · ${activeTrip.roundTrip ? 'there and back' : 'one way'}`
                    : mapMode === 'discover'
                      ? 'Compare their range areas, then open Trips to check a specific drive.'
                      : 'Pick a trip to compare arrival charge.'}
                </p>
              </div>
              <button
                className="buyer-secondary"
                onClick={() => goToSection('buyer-catalog')}
              >
                <FiPlus aria-hidden="true" /> Add cars
              </button>
            </div>
            {!selected.length ? (
              <div className="buyer-empty-shortlist">
                <h3>Add a car to get started</h3>
                <p>
                  Choose up to three EVs to explore their range. Open Trips when
                  you’re ready to check a drive.
                </p>
                <button
                  className="buyer-secondary"
                  onClick={() => goToSection('buyer-catalog')}
                >
                  Choose cars <FiArrowRight aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <VehicleRail
                  vehicles={selected}
                  activeId={activeCar?.variant.id ?? ''}
                  trip={activeTrip}
                  scenario={scenario}
                  onSelect={setActiveVehicle}
                  onRemove={toggleCar}
                  onConfigure={configureCar}
                  onTerrainChange={(id, inputs) =>
                    setTerrainInputs((previous) => ({
                      ...previous,
                      [id]: inputs
                    }))
                  }
                />
                <div className="buyer-rail-tools">
                  <button
                    className="buyer-text-link"
                    onClick={() => {
                      const panel = document.getElementById(
                        'buyer-assumptions'
                      ) as HTMLDetailsElement | null
                      if (panel) {
                        panel.open = true
                        panel.scrollIntoView({ block: 'nearest' })
                        panel
                          .querySelector('input')
                          ?.focus({ preventScroll: true })
                      }
                    }}
                  >
                    {scenario.charge}% start · {scenario.temperature}°F ·{' '}
                    {scenario.reserve}% reserve{' '}
                    <FiChevronDown aria-hidden="true" />
                  </button>
                  <span className="buyer-swipe-hint">
                    Swipe to choose a car <FiArrowRight aria-hidden="true" />
                  </span>
                </div>
                <details className="buyer-comparison-details">
                  <summary>
                    Compare specifications & sources{' '}
                    <FiChevronDown aria-hidden="true" />
                  </summary>
                  {activeTrip?.route && (
                    <RouteTerrain
                      profile={activeTrip.route.elevation}
                      fit={activeFit ?? undefined}
                    />
                  )}
                  <div
                    className="buyer-table-scroll"
                    role="region"
                    aria-label="Vehicle comparison"
                    tabIndex={0}
                  >
                    <table
                      className={`buyer-comparison-table buyer-columns-${selected.length}`}
                    >
                      <caption className="sr-only">
                        Estimated charge for your selected trip, with shared
                        assumptions for every car.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">
                            {activeTrip?.route ? activeTrip.label : 'Cars'}
                          </th>
                          {selected.map((option) => (
                            <th
                              scope="col"
                              key={option.variant.id}
                              className={
                                activeCar?.variant.id === option.variant.id
                                  ? 'active'
                                  : ''
                              }
                            >
                              <button
                                className="buyer-car-heading"
                                onClick={() =>
                                  setActiveVehicle(option.variant.id)
                                }
                                aria-pressed={
                                  activeCar?.variant.id === option.variant.id
                                }
                              >
                                <small>
                                  {option.car.modelYear} · {option.car.brand}
                                </small>
                                <strong>{option.car.model}</strong>
                                <span>{option.variant.name}</span>
                                <small className="buyer-car-state">
                                  {activeCar?.variant.id === option.variant.id
                                    ? 'Selected for map'
                                    : 'Select for map'}
                                </small>
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="buyer-arrival-row">
                          <th scope="row">Est. arrival charge</th>
                          {selected.map((option) => {
                            const fit = activeTrip?.route
                              ? estimateFit(option, activeTrip.route, scenario)
                              : null
                            return (
                              <td
                                key={option.variant.id}
                                className={fit?.status}
                              >
                                <strong>
                                  {fit
                                    ? fit.status === 'needs-charge'
                                      ? 'Charge needed'
                                      : `${Math.round(fit.arrival)}%`
                                    : '—'}
                                </strong>
                                <small>
                                  {fit
                                    ? statusLabel[fit.status]
                                    : 'Map a trip to estimate'}
                                </small>
                              </td>
                            )
                          })}
                        </tr>
                        <tr>
                          <th scope="row">
                            Reference trip range{' '}
                            <small>After reserve · before terrain</small>
                          </th>
                          {selected.map((option) => (
                            <td key={option.variant.id}>
                              {Math.round(
                                (fullRange(option, scenario).range *
                                  Math.max(
                                    0,
                                    scenario.charge - scenario.reserve
                                  )) /
                                  100
                              )}{' '}
                              mi
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <th scope="row">EPA combined</th>
                          {selected.map((option) => (
                            <td key={option.variant.id}>
                              {option.variant.range} mi
                            </td>
                          ))}
                        </tr>
                        {readyTrips.length > 1 &&
                          readyTrips.map((trip) => (
                            <tr key={trip.id}>
                              <th scope="row">
                                <button
                                  className="buyer-text-link"
                                  onClick={() => setActiveTripId(trip.id)}
                                >
                                  {trip.label}{' '}
                                  <FiArrowRight aria-hidden="true" />
                                </button>
                                <small>
                                  {Math.round(
                                    trip.route!.distance / MILES_TO_METERS
                                  )}{' '}
                                  mi ·{' '}
                                  {trip.roundTrip
                                    ? 'there and back'
                                    : 'one way'}
                                </small>
                              </th>
                              {selected.map((option) => {
                                const fit = estimateFit(
                                  option,
                                  trip.route!,
                                  scenario
                                )
                                return (
                                  <td
                                    key={option.variant.id}
                                    className={fit.status}
                                  >
                                    <strong>
                                      {fit.status === 'needs-charge'
                                        ? 'Charge needed'
                                        : `${Math.round(fit.arrival)}%`}
                                    </strong>
                                    <small>{statusLabel[fit.status]}</small>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        <tr>
                          <th scope="row">Details & sources</th>
                          {selected.map((option) => (
                            <td key={option.variant.id}>
                              <details className="buyer-evidence">
                                <summary>View evidence</summary>
                                <p>
                                  {`EPA ${fullRange(option, scenario).referenceBasis} range used.`}{' '}
                                  Temperature uses a generic adjustment.
                                </p>
                                <p>
                                  EPA highway:{' '}
                                  {option.variant.rangeHighwayMiles
                                    ? `${Math.round(option.variant.rangeHighwayMiles)} mi`
                                    : 'Not listed'}
                                  . MSRP:{' '}
                                  {option.variant.price
                                    ? `$${option.variant.price.toLocaleString()}`
                                    : 'Unverified'}
                                  .
                                </p>
                                <p>
                                  Retail trim and US availability require
                                  manufacturer verification.
                                </p>
                                <a
                                  href={option.variant.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  EPA record{' '}
                                  <FiArrowUpRight aria-hidden="true" />
                                </a>
                                {option.variant.manufacturerSourceUrl && (
                                  <a
                                    href={option.variant.manufacturerSourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Manufacturer{' '}
                                    <FiArrowUpRight aria-hidden="true" />
                                  </a>
                                )}
                                <p>
                                  Catalog imported{' '}
                                  {catalog
                                    ? new Date(
                                        catalog.importedAt
                                      ).toLocaleDateString()
                                    : '—'}
                                  .
                                </p>
                              </details>
                              <button
                                className="buyer-remove-car"
                                onClick={() => toggleCar(option)}
                                aria-label={`Remove ${vehicleTitle(option)} ${option.variant.name}`}
                              >
                                Remove car
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="buyer-tiny">
                    Battery estimates use EPA range and a generic temperature
                    adjustment. Terrain is included only when enabled with valid
                    vehicle inputs and complete elevation coverage. Wind,
                    changing driving speeds, and charging stops aren’t modeled.
                  </p>
                </details>
              </>
            )}
          </section>
        </div>
      </section>
      <details
        id="buyer-catalog"
        tabIndex={-1}
        className="buyer-catalog"
        open={catalogOpen}
        onToggle={(event) => setCatalogOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Find a car</span>
          <span>
            {catalogOpen ? 'Close index' : 'Browse index'}{' '}
            {catalogOpen ? (
              <FiX aria-hidden="true" />
            ) : (
              <FiPlus aria-hidden="true" />
            )}
          </span>
        </summary>
        <div className="buyer-catalog-content">
          <div className="buyer-heading-row">
            <div>
              <h2>Choose your cars</h2>
              <p>
                Browse current and historical EPA records. Adjust each car here
                or in your shortlist.
              </p>
            </div>
            <button
              className="buyer-secondary"
              disabled={!filtered.length}
              onClick={suggestCars}
            >
              Suggest by range
            </button>
            <p className="buyer-catalog-count">
              {filtered.length} {filtered.length === 1 ? 'car' : 'cars'}
            </p>
          </div>
          <div className="buyer-catalog-filters">
            <label className="buyer-catalog-search">
              <span className="sr-only">Search vehicles</span>
              <input
                placeholder="Search make, model, or configuration"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Make</span>
              <select
                value={make}
                onChange={(event) => setMake(event.target.value)}
              >
                <option value="all">All makes</option>
                {makes.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Model year</span>
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
              >
                <option value="recent">Latest model years</option>
                <option value="all">All years · archive</option>
                {years.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          {isLoading || isPlaceholderData ? (
            <p role="status" className="buyer-catalog-state">
              Loading the vehicle catalog…
            </p>
          ) : isError ? (
            <div className="buyer-catalog-state" role="alert">
              The catalog could not load.{' '}
              <button onClick={() => void refetch()}>Try again</button>
            </div>
          ) : !filtered.length ? (
            <p className="buyer-catalog-state">No cars match these filters.</p>
          ) : (
            <>
              <div className="buyer-catalog-grid">
                {filtered.slice(0, limit).map((option) => (
                  <article key={option.car.id}>
                    <div>
                      <span>
                        {option.car.modelYear} / {option.car.brand}
                      </span>
                      <h3>{option.car.model}</h3>
                      <p>
                        {option.car.variants.length} EPA configuration
                        {option.car.variants.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <VehicleConfiguration
                      option={option}
                      onChange={(variant) => configureCar(option, variant)}
                    />
                    <div className="buyer-catalog-bottom">
                      <strong>
                        {option.variant.range}
                        <small> mi EPA</small>
                      </strong>
                      <button
                        className={
                          shortlist.includes(option.variant.id)
                            ? 'selected'
                            : ''
                        }
                        aria-pressed={shortlist.includes(option.variant.id)}
                        disabled={
                          shortlist.length >= 3 &&
                          !shortlist.includes(option.variant.id)
                        }
                        aria-label={`${shortlist.includes(option.variant.id) ? 'Remove' : 'Compare'} ${vehicleTitle(option)} ${option.variant.name}`}
                        onClick={() => toggleCar(option)}
                      >
                        {shortlist.includes(option.variant.id) ? (
                          <>
                            <FiCheck aria-hidden="true" /> Added
                          </>
                        ) : shortlist.length >= 3 ? (
                          'Shortlist full'
                        ) : (
                          <>
                            <FiPlus aria-hidden="true" /> Compare
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {filtered.length > limit && (
                <button
                  className="buyer-show-more"
                  onClick={() => setLimit((previous) => previous + 18)}
                >
                  Show 18 more cars <FiChevronDown aria-hidden="true" />
                </button>
              )}
            </>
          )}
          <p className="buyer-catalog-provenance">
            EPA baseline imported{' '}
            {catalog ? new Date(catalog.importedAt).toLocaleDateString() : '—'}.
            EPA configurations can differ from retail trim names. Current US
            availability, pricing, and manufacturer details are being verified.
            Historical records do not imply current availability.{' '}
            <a
              href="https://www.fueleconomy.gov/feg/ws/index.shtml"
              target="_blank"
              rel="noreferrer"
            >
              Source & methodology <FiArrowUpRight aria-hidden="true" />
            </a>
          </p>
          <button
            className="buyer-text-link"
            onClick={() => goToSection('buyer-shortlist')}
          >
            Back to comparison ({selected.length}{' '}
            {selected.length === 1 ? 'car' : 'cars'}){' '}
            <FiArrowUp aria-hidden="true" />
          </button>
        </div>
      </details>
      <div className="buyer-save-status">
        <p role="status">
          {saveAvailable ? (
            <>
              <FiCheck aria-hidden="true" /> Saved on this device
            </>
          ) : (
            'Device saving is unavailable. Keep this tab open to keep your workspace.'
          )}
        </p>
        <details key={workspaceKey}>
          <summary>Start fresh</summary>
          <p>
            Clear your saved cars, places, and trip settings on this device?
          </p>
          <button className="buyer-secondary" onClick={startFresh}>
            Clear workspace
          </button>
        </details>
      </div>
      <RangerFooter onGuide={() => changeGuide('welcome')} />
      <div className="sr-only" aria-live="polite">
        {routeFingerprint && readyTrips.length
          ? `${readyTrips.length} routes ready to compare.`
          : ''}
      </div>
    </main>
  )
}
