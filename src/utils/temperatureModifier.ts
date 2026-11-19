/**
 * Generic scenario adjustment in Fahrenheit, retained from the prototype.
 * This is a heuristic, not a vehicle-specific or measured performance model.
 * Do not present it as a calibrated weather prediction.
 */
export const getTempModifier = (temperature: number): number => {
  if (!Number.isFinite(temperature)) return 1
  if (temperature >= 70 && temperature <= 75) return 1
  if (temperature < 70) {
    return Math.max(0.5, 1 - 0.5 * ((70 - temperature) / 90))
  }
  return Math.max(0.85, 1 - 0.15 * ((temperature - 75) / 45))
}
