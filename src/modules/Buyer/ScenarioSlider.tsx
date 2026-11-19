import { useId, useState, type CSSProperties } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}

export default function ScenarioSlider({
  label,
  value,
  min,
  max,
  unit,
  onChange
}: Props) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  return (
    <div className={`buyer-slider${dragging ? ' dragging' : ''}`}>
      <div className="buyer-slider-heading">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={`${value}${unit}`}
        style={
          {
            '--slider-fill': `${((value - min) / (max - min)) * 100}%`
          } as CSSProperties
        }
        onChange={(event) => onChange(Number(event.target.value))}
        onClick={(event) => event.currentTarget.focus({ preventScroll: true })}
        onPointerDown={(event) => {
          event.currentTarget.focus({ preventScroll: true })
          setDragging(true)
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        onBlur={() => setDragging(false)}
      />
      <div className="buyer-slider-ends" aria-hidden="true">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}
