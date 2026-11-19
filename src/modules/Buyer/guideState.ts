export const GUIDE_KEY = 'evranger:first-use:v1'
export const GUIDE_STEPS = [
  'cars',
  'origin',
  'conditions',
  'places',
  'trip'
] as const
export type GuideStep = (typeof GUIDE_STEPS)[number]
export type GuideStage = GuideStep | 'welcome' | 'dismissed' | 'complete'

export function readGuide(storage?: Pick<Storage, 'getItem'>): GuideStage {
  try {
    const value = (storage ?? window.localStorage).getItem(GUIDE_KEY)
    return value === 'dismissed' ||
      value === 'complete' ||
      GUIDE_STEPS.some((step) => step === value)
      ? (value as GuideStage)
      : 'welcome'
  } catch {
    return 'welcome'
  }
}

export function saveGuide(
  stage: GuideStage,
  storage?: Pick<Storage, 'setItem'>
) {
  try {
    ;(storage ?? window.localStorage).setItem(GUIDE_KEY, stage)
  } catch {
    // The guide remains usable when device storage is blocked.
  }
}
