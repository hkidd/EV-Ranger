import { useEffect, useState } from 'react'
import { fetchWeather } from './buyerApi'
import type { Place, RoadRoute, WeatherSample, Coordinate } from './types'

import { weatherCoordinates } from './weatherModel'
export default function RouteWeather({
  route,
  origin,
  temperature,
  onApply
}: {
  route?: RoadRoute
  origin: Place | null
  temperature: number
  onApply: (temperature: number) => void
}) {
  const key = JSON.stringify(weatherCoordinates(route, origin))
  const [result, setResult] = useState<{
    key: string
    samples: WeatherSample[]
    error?: string
  }>()
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const coordinates: Coordinate[] = JSON.parse(key)
    if (!coordinates.length) return
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 22000)
    void fetchWeather(coordinates, controller.signal)
      .then((samples) => {
        if (!controller.signal.aborted) setResult({ key, samples })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key,
            samples: [],
            error:
              'Weather is unavailable. Your comparison settings still apply.'
          })
      })
    const deadline = setTimeout(
      () =>
        setResult((previous) =>
          previous?.key === key
            ? previous
            : { key, samples: [], error: 'Weather timed out. Try refreshing.' }
        ),
      22500
    )
    return () => {
      controller.abort()
      clearTimeout(timeout)
      clearTimeout(deadline)
    }
  }, [key, refresh])
  if (!origin) return null
  const current = result?.key === key ? result : undefined
  const available =
    current?.samples.filter((s) => s.status === 'available') || []
  const complete = Boolean(
    current?.samples.length && available.length === current.samples.length
  )
  const mean = complete
    ? Math.round(
        available.reduce((sum, s) => sum + s.temperatureF!, 0) /
          available.length
      )
    : null
  return (
    <details className="buyer-weather">
      <summary>
        {route ? 'Route weather' : 'Weather at the start'}{' '}
        <span>
          {!current
            ? 'Loading…'
            : available.length
              ? `${Math.round(Math.min(...available.map((s) => s.temperatureF!)))}–${Math.round(Math.max(...available.map((s) => s.temperatureF!)))}°F`
              : 'Unavailable'}
        </span>
      </summary>
      <p className="buyer-tiny">
        Current-hour NWS forecasts at sampled locations, not live observations
        or arrival-time forecasts.
      </p>
      <ol className="buyer-weather-samples">
        {current?.samples.map((sample, i) => (
          <li key={i}>
            <strong>
              {current.samples.length === 1
                ? 'Starting point'
                : [
                    'Start',
                    'Along route',
                    route?.roundTrip ? 'Return' : 'Destination'
                  ][i]}
            </strong>
            {sample.status === 'available' ? (
              <>
                <span>
                  {Math.round(sample.temperatureF!)}°F · {sample.summary}
                </span>
                <small>
                  Wind {sample.wind || 'not reported'} ·{' '}
                  {new Date(sample.validFrom!).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  –
                  {new Date(sample.validTo!).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </small>
              </>
            ) : (
              <span>Weather unavailable here</span>
            )}
          </li>
        ))}
      </ol>
      {current?.error && <p role="status">{current.error}</p>}
      {mean !== null && (
        <button
          className="buyer-secondary"
          onClick={() => onApply(Math.max(-20, Math.min(120, mean)))}
        >
          Use {mean}°F
        </button>
      )}
      <button
        className="buyer-text-button"
        disabled={!current}
        onClick={() => {
          setResult(undefined)
          setRefresh((n) => n + 1)
        }}
      >
        Refresh weather
      </button>
      <p className="buyer-tiny">
        Using {temperature}°F for this comparison. You can use the sample
        average or set your own temperature. Wind and rain don’t change the
        estimate yet.
      </p>
      <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">
        Weather: National Weather Service
      </a>
    </details>
  )
}
