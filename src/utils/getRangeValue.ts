import { CarVariant } from '../types'

/**
 * Retrieves the range value based on variant, battery, and wheel selections.
 *
 * @param variant - The selected car variant.
 * @param batteryName - The selected battery name.
 * @param wheelName - The selected wheel name.
 * @returns The corresponding range value in miles, or null if not found.
 */
export const getRangeValue = (
  variant: CarVariant,
  battery: string,
  wheelName: string
): number | null => {
  const batteryMapping = variant.rangeMaps
    ? variant.rangeMaps[battery || 'battery']
    : undefined

  if (!batteryMapping && !variant.range) {
    return null
  } else if (!batteryMapping && variant.range) {
    return variant.range
  }

  // Iterate through the keys in batteryMapping to find a match
  for (const wheelType of Object.keys(batteryMapping || {})) {
    if (wheelName.toLowerCase().includes(wheelType.toLowerCase())) {
      return batteryMapping ? batteryMapping[wheelType] : variant.range
    }
  }

  return variant.range
}
