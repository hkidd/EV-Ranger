import { vehicleColor } from './vehicleAppearance'
import { useTheme } from '../../context/ThemeContext'
import ResponsiveDisclosure from './ResponsiveDisclosure'
import { useEffect, useRef } from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import TerrainInputsEditor from './TerrainInputsEditor'
import VehicleConfiguration from './VehicleConfiguration'
import type { CarVariant } from '../../types'
import { estimateFit, fullRange, vehicleTitle } from './estimates'
import type { LifeTrip, Scenario, VehicleOption, TerrainInputs } from './types'

interface Props {
  vehicles: VehicleOption[]
  activeId: string
  trip: LifeTrip | undefined
  scenario: Scenario
  onSelect: (id: string) => void
  onRemove: (option: VehicleOption) => void
  onTerrainChange: (id: string, inputs: TerrainInputs) => void
  onConfigure: (option: VehicleOption, variant: CarVariant) => void
}

const outcome = {
  'reserve-met': 'Reserve met',
  'below-reserve': 'Below reserve',
  'needs-charge': 'Charge needed'
}

export default function VehicleRail({
  vehicles,
  activeId,
  trip,
  scenario,
  onSelect,
  onRemove,
  onConfigure,
  onTerrainChange
}: Props) {
  const { isDarkMode } = useTheme()
  const rail = useRef<HTMLDivElement>(null)
  const settling = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const aligning = useRef(false)
  const releaseAlignment = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const drag = useRef({ x: 0, scroll: 0, moved: false, down: false })
  const selection = useRef({ activeId, onSelect })
  useEffect(() => {
    selection.current = { activeId, onSelect }
  }, [activeId, onSelect])
  useEffect(
    () => () => {
      clearTimeout(settling.current)
      clearTimeout(releaseAlignment.current)
    },
    []
  )
  useEffect(() => {
    const align = () => {
      const region = rail.current
      const selected = region?.querySelector<HTMLElement>(
        '[data-selected="true"]'
      )
      if (!region || !selected) return
      clearTimeout(settling.current)
      clearTimeout(releaseAlignment.current)
      aligning.current = true
      const target =
        selected.getBoundingClientRect().left -
        region.getBoundingClientRect().left +
        region.scrollLeft -
        (region.clientWidth - selected.clientWidth) / 2
      region.scrollTo({
        left: Math.max(0, target),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth'
      })
      releaseAlignment.current = setTimeout(() => {
        aligning.current = false
      }, 450)
    }
    align()
    window.addEventListener('resize', align)
    return () => window.removeEventListener('resize', align)
  }, [activeId, vehicles.length])
  function selectNearest() {
    const region = rail.current
    if (!region) return
    const center = region.getBoundingClientRect().left + region.clientWidth / 2
    const cards = [...region.querySelectorAll<HTMLElement>('[data-vehicle]')]
    const closest = cards.reduce<HTMLElement | null>((best, card) => {
      const distance = (node: HTMLElement) =>
        Math.abs(
          node.getBoundingClientRect().left + node.clientWidth / 2 - center
        )
      return !best || distance(card) < distance(best) ? card : best
    }, null)
    const id = closest?.dataset.vehicle
    if (id && id !== selection.current.activeId) selection.current.onSelect(id)
  }
  return (
    <div
      className="buyer-vehicle-rail"
      ref={rail}
      role="group"
      aria-label="Choose a car for the map"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('select, input, label'))
          return
        aligning.current = false
        clearTimeout(releaseAlignment.current)
        if (event.pointerType === 'mouse' && event.button === 0)
          drag.current = {
            x: event.clientX,
            scroll: event.currentTarget.scrollLeft,
            moved: false,
            down: true
          }
      }}
      onPointerMove={(event) => {
        const state = drag.current
        const region = event.currentTarget
        if (
          !state.down ||
          event.pointerType !== 'mouse' ||
          region.scrollWidth <= region.clientWidth
        )
          return
        const delta = event.clientX - state.x
        if (!state.moved && Math.abs(delta) < 8) return
        state.moved = true
        clearTimeout(settling.current)
        region.setPointerCapture(event.pointerId)
        region.dataset.dragging = 'true'
        region.style.scrollSnapType = 'none'
        region.scrollLeft = state.scroll - delta
        event.preventDefault()
      }}
      onPointerUp={(event) => {
        drag.current.down = false
        event.currentTarget.dataset.dragging = 'false'
        event.currentTarget.style.scrollSnapType = ''
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
        if (drag.current.moved) selectNearest()
      }}
      onPointerCancel={(event) => {
        drag.current.down = false
        drag.current.moved = false
        event.currentTarget.dataset.dragging = 'false'
        event.currentTarget.style.scrollSnapType = ''
      }}
      onClickCapture={(event) => {
        if (drag.current.moved) {
          event.preventDefault()
          event.stopPropagation()
          drag.current.moved = false
        }
      }}
      onWheel={() => {
        aligning.current = false
        clearTimeout(releaseAlignment.current)
      }}
      onScroll={() => {
        if (aligning.current) return
        if (!window.matchMedia('(max-width: 760px)').matches) return
        clearTimeout(settling.current)
        if (!drag.current.down)
          settling.current = setTimeout(selectNearest, 180)
      }}
    >
      {vehicles.map((option, index) => {
        const id = option.variant.id
        const active = id === activeId
        const fit = trip?.route
          ? estimateFit(option, trip.route, scenario)
          : null
        return (
          <article
            key={option.car.id}
            className={`buyer-rail-card${active ? ' active' : ''}`}
            data-vehicle={id}
            data-selected={active}
          >
            <button
              className="buyer-rail-select"
              aria-pressed={active}
              aria-label={`Show ${vehicleTitle(option)} ${option.variant.name} on map${fit ? `, ${fit.status === 'needs-charge' ? 'charge needed' : `${Math.round(fit.arrival)} percent estimated arrival`}` : ''}`}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                onSelect(id)
              }}
              onKeyDown={(event) => {
                if (
                  !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                    event.key
                  )
                )
                  return
                event.preventDefault()
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? vehicles.length - 1
                      : (index +
                          (event.key === 'ArrowRight' ? 1 : -1) +
                          vehicles.length) %
                        vehicles.length
                onSelect(vehicles[next].variant.id)
                const buttons =
                  rail.current?.querySelectorAll<HTMLButtonElement>(
                    '.buyer-rail-select'
                  )
                buttons?.[next]?.focus({ preventScroll: true })
              }}
            >
              <div className="buyer-rail-identity">
                <small>
                  <i
                    className="buyer-car-swatch"
                    style={{ background: vehicleColor(index, isDarkMode) }}
                    aria-hidden="true"
                  />
                  {option.car.modelYear} · {option.car.brand}
                </small>
                <strong>{option.car.model}</strong>
                <span>{option.variant.name}</span>
              </div>
              <div className={`buyer-rail-result ${fit?.status ?? ''}`}>
                <strong>
                  {fit
                    ? fit.status === 'needs-charge'
                      ? 'Charge needed'
                      : `${Math.round(fit.arrival)}%`
                    : `${Math.round((fullRange(option, scenario).range * Math.max(0, scenario.charge - scenario.reserve)) / 100)} mi`}
                </strong>
                <span>{fit ? 'est. arrival' : 'before reserve'}</span>
              </div>
              <span className={`buyer-rail-state ${fit?.status ?? ''}`}>
                <span>
                  {active ? (
                    <>
                      <FiCheck aria-hidden="true" /> On the map
                    </>
                  ) : (
                    'Select for map'
                  )}
                </span>
                {fit && <span>{outcome[fit.status]}</span>}
              </span>
            </button>
            {fit?.terrainStatus === 'applied' && (
              <p className="buyer-terrain-applied">
                Elevation included ·{' '}
                {fit.terrainChargeDifference >= 0 ? '+' : ''}
                {fit.terrainChargeDifference.toFixed(1)} charge points
              </p>
            )}
            {fit &&
              option.terrain?.enabled &&
              fit.terrainStatus !== 'applied' && (
                <p className="buyer-terrain-applied" role="status">
                  {fit.terrainStatus === 'missing-inputs'
                    ? 'Add battery and weight to include hills'
                    : !trip?.route?.elevation
                      ? 'Loading elevation…'
                      : 'Elevation unavailable · using EPA range'}
                </p>
              )}
            <ResponsiveDisclosure
              className="buyer-rail-setup"
              title="Trim, wheels & elevation"
            >
              <VehicleConfiguration
                option={option}
                onChange={(variant) => onConfigure(option, variant)}
              />
              <TerrainInputsEditor
                option={option}
                onChange={(inputs) => onTerrainChange(id, inputs)}
              />
            </ResponsiveDisclosure>
            <button
              className="buyer-rail-remove"
              aria-label={`Remove ${vehicleTitle(option)} ${option.variant.name}`}
              onClick={() => onRemove(option)}
            >
              <FiX aria-hidden="true" />
            </button>
          </article>
        )
      })}
    </div>
  )
}
