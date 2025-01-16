/**
 * Returns a temperature modifier multiplier based on external temperature.
 * The function is extrapolated to cover temperatures from -20°F to 120°F.
 *
 * Data points (assumed or per your original data):
 *   (-20°F, ~0.305)   - extrapolated value
 *   (5°F,  0.54)
 *   (70°F, 1.15)
 *   (104°F, 0.80)
 *   (120°F, ~0.635)   - extrapolated value
 *
 * Linear interpolation is used between these points.
 *
 * @param temp - The external temperature in °F.
 * @returns The multiplier as a number.
 */
export function getTempModifier(temp: number): number {
  if (temp <= 5) {
    // Segment 1: interpolate between (-20°F, 0.305) and (5°F, 0.54)
    const t0 = -20
    const t1 = 5
    const m0 = 0.305
    const m1 = 0.54
    const clampedTemp = Math.max(temp, t0)
    const slope = (m1 - m0) / (t1 - t0)
    return m0 + slope * (clampedTemp - t0)
  } else if (temp <= 70) {
    // Segment 2: interpolate between (5°F, 0.54) and (70°F, 1.15)
    const t0 = 5
    const t1 = 70
    const m0 = 0.54
    const m1 = 1.15
    const slope = (m1 - m0) / (t1 - t0)
    return m0 + slope * (temp - t0)
  } else if (temp <= 104) {
    // Segment 3: interpolate between (70°F, 1.15) and (104°F, 0.80)
    const t0 = 70
    const t1 = 104
    const m0 = 1.15
    const m1 = 0.8
    const slope = (m1 - m0) / (t1 - t0)
    return m0 + slope * (temp - t0)
  } else {
    // Segment 4: interpolate between (104°F, 0.80) and (120°F, 0.635)
    const t0 = 104
    const t1 = 120
    const m0 = 0.8
    const m1 = 0.635
    const clampedTemp = Math.min(temp, t1)
    const slope = (m1 - m0) / (t1 - t0)
    return m0 + slope * (clampedTemp - t0)
  }
}
