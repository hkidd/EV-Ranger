import type { CarVariant } from '../../types'
import type { VehicleOption } from './types'
import { configurationParts } from './vehicleFamilies'

interface Props {
  option: VehicleOption
  onChange: (variant: CarVariant) => void
}

export default function VehicleConfiguration({ option, onChange }: Props) {
  const variants = option.car.variants
  const parts = (variant: CarVariant) => {
    const value = configurationParts(variant.name)
    const duplicate = variants.some(
      (candidate) =>
        candidate.id !== variant.id &&
        configurationParts(candidate.name).configuration ===
          value.configuration &&
        configurationParts(candidate.name).setup === value.setup
    )
    return duplicate
      ? {
          ...value,
          configuration: `${value.configuration} · EPA record ${variant.epaVehicleId ?? variant.id}`
        }
      : value
  }
  const current = parts(option.variant)
  const configurations = [
    ...new Set(variants.map((variant) => parts(variant).configuration))
  ]
  const setups = variants.filter(
    (variant) => parts(variant).configuration === current.configuration
  )
  const label = `${option.car.brand} ${option.car.model}`
  return (
    <div className="buyer-vehicle-configuration">
      <label>
        <span>Trim / battery</span>
        <select
          aria-label={`Trim or battery configuration for ${label}`}
          value={current.configuration}
          disabled={configurations.length < 2}
          onChange={(event) => {
            const matches = variants.filter(
              (variant) => parts(variant).configuration === event.target.value
            )
            const next =
              matches.find(
                (variant) => parts(variant).setup === current.setup
              ) ?? matches[0]
            if (next) onChange(next)
          }}
        >
          {configurations.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Wheels / tires</span>
        <select
          aria-label={`Wheel or tire setup for ${label}`}
          value={option.variant.id}
          disabled={setups.length < 2}
          onChange={(event) => {
            const next = variants.find(
              (variant) => variant.id === event.target.value
            )
            if (next) onChange(next)
          }}
        >
          {setups.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {parts(variant).setup} · {variant.range} mi EPA
            </option>
          ))}
        </select>
      </label>
      {option.variant.battery_size?.length ? (
        <p>Battery: {option.variant.battery_size.join(' / ')}</p>
      ) : null}
    </div>
  )
}
