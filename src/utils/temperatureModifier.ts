/**
 * Calculates how temperature affects EV range
 *
 * This utility function calculates a modifier that can be applied to an EV's range
 * based on the current temperature. Temperature significantly affects EV battery
 * performance, with both cold and hot temperatures reducing range.
 *
 * @param temperature - Temperature in Fahrenheit
 * @returns A multiplier between 0.6 and 1.0 to apply to the vehicle's range
 */
export const getTempModifier = (temperature: number): number => {
  // Optimal temperature range is 70-75°F
  if (temperature >= 70 && temperature <= 75) {
    return 1.0 // No adjustment needed
  }

  // Cold weather penalty (below 70°F)
  if (temperature < 70) {
    // Linear reduction down to 50% efficiency at -20°F
    const coldRange = 70 - -20
    const tempFromOptimal = 70 - temperature
    return Math.max(0.5, 1.0 - 0.4 * (tempFromOptimal / coldRange))
  }

  // Hot weather penalty (above 75°F)
  // Linear reduction down to 85% efficiency at 120°F
  const hotRange = 120 - 75
  const tempFromOptimal = temperature - 75
  return Math.max(0.85, 1.0 - 0.15 * (tempFromOptimal / hotRange))
}
