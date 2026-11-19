import { useId, useState } from 'react'
import { FiCloudSnow, FiSun, FiThermometer } from 'react-icons/fi'
import ScenarioSlider from '../Buyer/ScenarioSlider'
import { getTempModifier } from '../../utils/temperatureModifier'

const days = [
  { label: 'Mild', temperature: 70, icon: FiSun },
  { label: 'Cold', temperature: 20, icon: FiCloudSnow },
  { label: 'Hot', temperature: 95, icon: FiThermometer }
] as const
export default function RangeExample({
  compact = false
}: {
  compact?: boolean
}) {
  const titleId = useId()
  const [temperature, setTemperature] = useState(70)
  const [charge, setCharge] = useState(80)
  const reserve = 15,
    ratedRange = 300
  const budget = Math.round(
    (ratedRange *
      getTempModifier(temperature) *
      Math.max(0, charge - reserve)) /
      100
  )
  return (
    <section
      className={`ranger-range-example${compact ? ' compact' : ''}`}
      aria-labelledby={compact ? undefined : titleId}
      aria-label={compact ? 'Sample range estimate' : undefined}
    >
      <div className="ranger-example-intro">
        {!compact && <h2 id={titleId}>Try the range estimate</h2>}
        <p>
          This sample car is rated for 300 miles. Leave 15% in reserve, then try
          a different temperature or starting charge.
        </p>
      </div>
      <div
        className="ranger-example-days"
        role="group"
        aria-label="Sample weather"
      >
        {days.map(({ label, temperature: value, icon: Icon }) => (
          <button
            key={label}
            aria-pressed={temperature === value}
            onClick={() => setTemperature(value)}
          >
            <Icon aria-hidden="true" />
            <span>
              {label}
              <small>{value}°F</small>
            </span>
          </button>
        ))}
      </div>
      <ScenarioSlider
        label="Sample starting charge"
        value={charge}
        min={15}
        max={100}
        unit="%"
        onChange={setCharge}
      />
      <figure className="ranger-example-distance">
        <figcaption>
          <span>Miles before the reserve</span>
          <output aria-live="polite">
            {budget} <small>miles</small>
          </output>
        </figcaption>
        <div className="ranger-example-track" aria-hidden="true">
          <span style={{ width: `${(budget / ratedRange) * 100}%` }} />
        </div>
        <div className="ranger-example-scale">
          <span>Starting point</span>
          <span>300 mi rated</span>
        </div>
      </figure>
      <p className="buyer-tiny">
        This is a sample, not a real car. It uses the same temperature model as
        the comparison, without elevation, wind or charging stops.
      </p>
    </section>
  )
}
