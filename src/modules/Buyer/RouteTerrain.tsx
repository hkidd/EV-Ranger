import type { ElevationProfile, FitEstimate } from './types'

export default function RouteTerrain({
  profile,
  fit
}: {
  profile?: ElevationProfile
  fit?: FitEstimate
}) {
  const complete =
    profile?.status === 'available' &&
    profile.samples.length > 1 &&
    profile.samples.every((point) => point.elevationMeters !== null)
  const elevations = complete
    ? profile.samples.map((point) => point.elevationMeters!)
    : []
  const min = Math.min(...elevations),
    max = Math.max(...elevations)
  const distance = complete
    ? profile.samples[profile.samples.length - 1].distanceMeters
    : 0
  const feet = (meters: number) => Math.round(meters * 3.28084).toLocaleString()
  const points = complete
    ? profile.samples
        .map(
          (point) =>
            `${12 + (distance ? point.distanceMeters / distance : 0) * 456},${86 - ((point.elevationMeters! - min) / Math.max(10, max - min)) * 65}`
        )
        .join(' ')
    : ''
  return (
    <div className="buyer-terrain-profile">
      <div>
        <h3>Road elevation</h3>
        <p>
          {complete
            ? `${feet(profile.ascentMeters ?? 0)} ft estimated climb · ${feet(profile.descentMeters ?? 0)} ft descent`
            : !profile
              ? 'Checking elevation coverage…'
              : profile.status === 'partial'
                ? 'Elevation covers only part of this route.'
                : 'Elevation is not available for this route yet.'}
        </p>
      </div>
      {complete && (
        <figure>
          <svg
            viewBox="0 0 480 100"
            role="img"
            aria-label={`Road elevation from ${feet(elevations[0])} feet to ${feet(elevations[elevations.length - 1])} feet; lowest ${feet(min)} feet, highest ${feet(max)} feet.`}
          >
            <path d="M12 90H468" className="buyer-terrain-axis" />
            <polyline
              points={points}
              fill="none"
              className="buyer-terrain-line"
            />
          </svg>
          <figcaption>
            {feet(min)}–{feet(max)} ft elevation · samples about every{' '}
            {Math.round((profile.sampleSpacingMeters / 1609.344) * 10) / 10} mi
          </figcaption>
        </figure>
      )}
      <p className="buyer-tiny">
        {fit?.terrainStatus === 'applied'
          ? `Elevation changes the arrival estimate by ${fit.terrainChargeDifference >= 0 ? '+' : ''}${fit.terrainChargeDifference.toFixed(1)} percentage points. `
          : fit?.terrainStatus === 'missing-elevation'
            ? 'Elevation data is incomplete for this route. This estimate uses EPA range and temperature. '
            : 'Enter battery capacity and weight in Elevation settings to include hills. '}
        Ground elevation can differ from bridges and tunnels.{' '}
        {complete && (
          <a
            href="https://www.usgs.gov/3d-elevation-program/about-3dep-products-services"
            target="_blank"
            rel="noreferrer"
          >
            Elevation source: USGS 3DEP
          </a>
        )}
      </p>
    </div>
  )
}
