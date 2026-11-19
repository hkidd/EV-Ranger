// Color identifies a shortlisted car; road-charge status keeps its separate semantic palette.
const colors = [
  { day: '#365f44', night: '#c4db8a' },
  { day: '#286c9e', night: '#85bfe8' },
  { day: '#a94729', night: '#eca28a' }
] as const
export function vehicleColor(slot: number, dark: boolean) {
  const color = colors[slot % colors.length]
  return dark ? color.night : color.day
}
