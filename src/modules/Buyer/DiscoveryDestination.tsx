import { vehicleColor } from './vehicleAppearance'
import { useTheme } from '../../context/ThemeContext'
import ResponsiveDisclosure from './ResponsiveDisclosure'
import { estimateFit, MILES_TO_METERS, vehicleTitle } from './estimates'
import type { DiscoveryPlace, Scenario, VehicleOption } from './types'
const outcome = {
  'reserve-met': 'reserve met',
  'below-reserve': 'below reserve',
  'needs-charge': 'extra charge needed'
}
function arrival(fit: ReturnType<typeof estimateFit> | null, failed?: string) {
  return !fit
    ? failed
      ? 'Route unavailable'
      : 'Checking route…'
    : fit.status === 'needs-charge'
      ? 'Extra charge needed'
      : `${Math.round(fit.arrival)}% arrival · ${outcome[fit.status]}`
}
export default function DiscoveryDestination({
  place,
  index,
  vehicles,
  active,
  scenario,
  roundTrip,
  canAdd,
  onChoose
}: {
  place: DiscoveryPlace
  index: number
  vehicles: VehicleOption[]
  active?: VehicleOption
  scenario: Scenario
  roundTrip: boolean
  canAdd: boolean
  onChoose: (place: DiscoveryPlace, roundTrip: boolean) => void
}) {
  const { isDarkMode } = useTheme()
  const fit =
    active && place.route ? estimateFit(active, place.route, scenario) : null
  const miles = place.route
    ? `${Math.round(place.route.distance / MILES_TO_METERS)} mi ${roundTrip ? 'return' : 'one way'}`
    : 'Route pending'
  return (
    <li>
      <ResponsiveDisclosure
        className="buyer-destination"
        title={
          <>
            <span>
              <strong>
                {index + 1}. {place.label}
              </strong>
              <small>{miles}</small>
            </span>
            <span className={fit ? `buyer-fit-${fit.status}` : ''}>
              {arrival(fit, place.error)}
            </span>
          </>
        }
      >
        <div className="buyer-destination-body">
          <div className="buyer-destination-address">
            <h3>
              {index + 1}. {place.label}
            </h3>
            <p>{place.address}</p>
            <span>{miles}</span>
          </div>
          <ul aria-label={`Vehicle estimates for ${place.label}`}>
            {vehicles.map((vehicle, slot) => {
              const result = place.route
                ? estimateFit(vehicle, place.route, scenario)
                : null
              return (
                <li key={vehicle.variant.id}>
                  <strong>
                    <i
                      className="buyer-car-swatch"
                      style={{ background: vehicleColor(slot, isDarkMode) }}
                      aria-hidden="true"
                    />
                    {vehicleTitle(vehicle)}
                  </strong>
                  <span className={result ? `buyer-fit-${result.status}` : ''}>
                    {arrival(result, place.error)}
                  </span>
                  {result && (
                    <small>
                      {result.terrainStatus === 'applied'
                        ? 'Elevation included'
                        : 'EPA + temperature; terrain not applied'}
                    </small>
                  )}
                </li>
              )
            })}
          </ul>
          <button
            className="buyer-secondary"
            aria-label={`Compare trip to ${place.label}`}
            disabled={!place.route || !canAdd}
            onClick={() => onChoose(place, roundTrip)}
          >
            Compare in Trips
          </button>
          {place.error && <p className="buyer-inline-error">{place.error}</p>}
        </div>
      </ResponsiveDisclosure>
    </li>
  )
}
