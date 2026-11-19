import type { TerrainInputs, VehicleOption } from './types'
import { validTerrainInputs } from './routeEnergy'

interface Props {
  option: VehicleOption
  onChange: (inputs: TerrainInputs) => void
}
export default function TerrainInputsEditor({ option, onChange }: Props) {
  const inputs = option.terrain ?? { enabled: false }
  const title = `${option.car.brand} ${option.car.model}`
  return (
    <details className="buyer-terrain-inputs">
      <summary>
        {inputs.enabled && validTerrainInputs(inputs)
          ? 'Elevation included'
          : 'Elevation settings'}
      </summary>
      <p>
        To estimate hills, enter usable battery capacity and vehicle weight,
        including people and luggage.
      </p>
      <label>
        <span>Usable battery · kWh</span>
        <input
          type="number"
          inputMode="decimal"
          min={5}
          max={300}
          step="any"
          placeholder="Not listed"
          aria-label={`Usable battery kWh for ${title}`}
          value={inputs.usableBatteryKwh ?? ''}
          onChange={(event) =>
            onChange({
              ...inputs,
              usableBatteryKwh:
                event.target.value === ''
                  ? undefined
                  : event.currentTarget.valueAsNumber
            })
          }
        />
      </label>
      <label>
        <span>Total vehicle weight · lb</span>
        <input
          type="number"
          inputMode="numeric"
          min={882}
          max={22046}
          step="any"
          placeholder="Not listed"
          aria-label={`Total vehicle weight lb for ${title}`}
          value={
            inputs.massKg === undefined
              ? ''
              : Math.round(inputs.massKg / 0.45359237)
          }
          onChange={(event) =>
            onChange({
              ...inputs,
              massKg:
                event.target.value === ''
                  ? undefined
                  : event.currentTarget.valueAsNumber * 0.45359237
            })
          }
        />
      </label>
      <label className="buyer-terrain-enable">
        <input
          type="checkbox"
          checked={inputs.enabled}
          disabled={!validTerrainInputs(inputs)}
          onChange={(event) =>
            onChange({ ...inputs, enabled: event.target.checked })
          }
        />
        <span>Include elevation in this car’s estimate</span>
      </label>
      {!validTerrainInputs(inputs) && (
        <p>
          Add a battery capacity of 5–300 kWh and total weight of 882–22,046 lb
          to include hills.
        </p>
      )}
      <p>
        Experimental model: 90% uphill efficiency, 65% regeneration, and a 50 kW
        regeneration limit. These are general assumptions, not measured vehicle
        performance. No terrain adjustment is applied outside elevation
        coverage.
      </p>
    </details>
  )
}
