import type { Car } from '../../types'

// Navigation families for the EPA snapshot, not a claim about retail trim names.
// Keep body styles apart; retain each complete EPA record as a configuration.
const families: Record<string, string[]> = {
  Acura: ['ZDX'],
  Audi: [
    'Q4 Sportback',
    'Q4',
    'Q6 Sportback',
    'Q6 e-tron SB',
    'Q6',
    'SQ6 Sportback',
    'SQ6',
    'A6',
    'S6',
    'S e-tron GT',
    'RS e-tron GT'
  ],
  BMW: ['iX3', 'iX4', 'iX5', 'iX', 'i3', 'i4', 'i5', 'i7'],
  Cadillac: ['CELESTIQ', 'LYRIQ', 'OPTIQ', 'VISTIQ'],
  Chevrolet: ['BOLT', 'Blazer EV', 'Equinox EV', 'Silverado EV'],
  Dodge: ['Charger Daytona'],
  Fiat: ['500e'],
  Ford: ['Mustang Mach-E'],
  GMC: ['SIERRA EV'],
  Genesis: ['Electrified G80', 'Electrified GV70', 'GV60'],
  Honda: ['Prologue'],
  Hyundai: ['Ioniq 5', 'Ioniq 6', 'Ioniq 9'],
  Jeep: ['Recon', 'Wagoneer S'],
  Kia: ['EV3', 'EV6', 'EV9', 'Niro Electric'],
  Lexus: ['ES', 'RZ', 'TZ'],
  Lucid: ['Air', 'Gravity'],
  MINI: ['Countryman'],
  Maserati: ['Grecale Folgore'],
  'Mercedes-Benz': ['AMG EQE', 'EQE', 'EQS', 'CLA250', 'CLA350', 'GLC400'],
  Nissan: ['ARIYA', 'LEAF'],
  Polestar: ['3', '4'],
  Porsche: ['Cayenne', 'Macan', 'Taycan'],
  Rivian: ['R1S', 'R1T', 'R2'],
  'Rolls-Royce': ['Spectre'],
  Subaru: ['Solterra', 'Trailseeker', 'Uncharted'],
  Tesla: [
    'Cybertruck',
    'Model 3',
    'Model S',
    'Model X',
    'Model Y L',
    'Model Y'
  ],
  Toyota: ['C-HR', 'bZ Woodland', 'bZ'],
  Vinfast: ['VF 7', 'VF 8', 'VF 9'],
  Volkswagen: ['ID.4'],
  Volvo: ['EC40', 'EX30', 'EX40', 'EX60', 'EX90']
}

function familyName(car: Car) {
  const prefix = families[car.brand]?.find(
    (name) =>
      car.model.toLowerCase() === name.toLowerCase() ||
      car.model.toLowerCase().startsWith(`${name.toLowerCase()} `)
  )
  if (!prefix) return car.model.replace(/\s*\([^)]*\)/g, '').trim()
  // These names encode distinct body styles in the EPA model field.
  if (car.brand === 'Mercedes-Benz' && /\(SUV\)/i.test(car.model))
    return `${prefix} SUV`
  if (car.brand === 'Porsche') {
    if (/Cross Turismo/i.test(car.model)) return `${prefix} Cross Turismo`
    if (/Sport Turismo/i.test(car.model)) return `${prefix} Sport Turismo`
    if (/Coupe/i.test(car.model)) return `${prefix} Coupe`
    if (prefix === 'Cayenne') return 'Cayenne Electric'
  }
  if (car.brand === 'Audi') {
    if (prefix === 'Q6 e-tron SB') return 'Q6 Sportback e-tron'
    if (
      prefix === 'Q4 Sportback' ||
      prefix === 'Q6 Sportback' ||
      prefix === 'SQ6 Sportback'
    )
      return `${prefix} e-tron`
    if (['A6', 'S6', 'Q4', 'Q6', 'SQ6'].includes(prefix))
      return `${prefix} e-tron`
  }
  return prefix
}

export function groupVehicleFamilies(cars: Car[]): Car[] {
  const groups = new Map<string, Car>()
  for (const car of cars) {
    const model = familyName(car)
    const id = JSON.stringify([car.modelYear, car.brand, model])
    let group = groups.get(id)
    if (!group) {
      group = { ...car, id, model, variants: [] }
      groups.set(id, group)
    }
    for (const variant of car.variants) {
      group.variants.push({
        ...variant,
        name:
          variant.manufacturerTrim ||
          `${car.model}${variant.name === 'EPA configuration' ? '' : ` · ${variant.name}`}`
      })
    }
  }
  return [...groups.values()]
}

// Split only explicitly named wheel/tire setups, never infer a size or range penalty.
export function configurationParts(name: string) {
  const match = name.match(
    /\(([^)]*(?:inch|\bin\b|\d+in|tire|wheel)[^)]*)\)|(?:with\s*|w\/)?\d+\s*(?:inch|in\.?)[ -]*(?:All[- ]Season|Summer|Cyber|Aero-Design)?\s*(?:wheels?|tires?)\b[^·]*|\d{3}\/\d{2}(?:ZR|R)\d+[^·]*/i
  )
  const setup = match?.[1] || match?.[0]
  const configuration = (match ? name.replace(match[0], '') : name)
    .replace(/\s*·\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim()
  return { configuration, setup: setup?.trim() || 'Setup not listed' }
}
