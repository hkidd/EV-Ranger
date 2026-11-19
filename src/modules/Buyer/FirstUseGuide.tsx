import { useEffect, useRef } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiMapPin,
  FiSearch,
  FiX
} from 'react-icons/fi'
import RangeExample from '../About/RangeExample'
import RangerMark from './RangerMark'
import { GUIDE_STEPS, type GuideStep } from './guideState'

const pages = {
  welcome: {
    title: 'Get to know EV Ranger',
    body: 'Explore what different electric cars could offer, then check the drives that matter to you. Here’s a quick look.'
  },
  cars: {
    title: 'Compare up to three cars',
    body: 'Open Find a car and choose Compare. Each car gets its own color. Change the trim and wheel setup in the catalog or your shortlist.'
  },
  origin: {
    title: 'Start wherever you like',
    body: 'Search for a town, ZIP code, or address. You can also choose to use your location. Your cars, places, and settings are saved in this browser.'
  },
  conditions: {
    title: 'See what a cold day changes',
    body: 'Set your starting charge, temperature, and the reserve you want left. Try this sample—the same temperature model powers your comparisons.'
  },
  trip: {
    title: 'Check a drive you know',
    body: 'When you have a shortlist, open Trips and add a destination. Choose one way or there and back, then compare estimated arrival charge. Elevation can be included when coverage and vehicle inputs are available.'
  },
  places: {
    title: 'Find somewhere worth the drive',
    body: 'Explore is your starting view, with an approximate range outline for each comparison car. Filter parks, museums, attractions, and campsites, then pan or zoom to explore the map. Select a place to check its actual road route.'
  }
}

/** A route diagram, not a geographic map or a promise of measured reach. */
function RouteDiagram({ branches = false }: { branches?: boolean }) {
  return (
    <div className="buyer-guide-route" aria-hidden="true">
      <svg viewBox="0 0 320 110" fill="none">
        <path
          d="M32 80H96L140 30H280"
          stroke="var(--buyer-green)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {branches && (
          <path
            d="M96 80H185L224 67H280M140 30L160 8H224"
            stroke="var(--buyer-guide-blue)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}
        <circle
          cx="32"
          cy="80"
          r="9"
          fill="var(--buyer-panel)"
          stroke="var(--buyer-green)"
          strokeWidth="3"
        />
        <circle cx="280" cy="30" r="7" fill="var(--buyer-green)" />
        {branches && (
          <>
            <circle cx="280" cy="67" r="6" fill="var(--buyer-guide-blue)" />
            <circle cx="224" cy="8" r="6" fill="var(--buyer-guide-blue)" />
          </>
        )}
      </svg>
      <div>
        <span>Starting point</span>
        <span>{branches ? 'Places to visit' : 'Your destination'}</span>
      </div>
    </div>
  )
}

function FeaturePreview({ step }: { step: GuideStep | 'welcome' }) {
  if (step === 'conditions') return <RangeExample compact />
  if (step === 'cars')
    return (
      <div className="buyer-guide-cars" aria-hidden="true">
        <div>
          <i />
          <strong>Car 1</strong>
          <span>Trim · wheels · range</span>
        </div>
        <div>
          <i />
          <strong>Car 2</strong>
          <span>Trim · wheels · range</span>
        </div>
      </div>
    )
  if (step === 'origin')
    return (
      <div className="buyer-guide-search" aria-hidden="true">
        <FiSearch />
        <span>Town, ZIP code, or address</span>
        <FiMapPin />
      </div>
    )
  return <RouteDiagram branches={step !== 'trip'} />
}

export default function FirstUseGuide({
  step,
  onChange,
  onFinish
}: {
  step: GuideStep | 'welcome'
  onChange: (step: GuideStep | 'welcome' | 'dismissed') => void
  onFinish: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const page = pages[step],
    index = GUIDE_STEPS.indexOf(step as GuideStep)
  useEffect(() => {
    const element = dialog.current
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const overflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    body.current?.scrollTo(0, 0)
  }, [step])
  return (
    <dialog
      ref={dialog}
      className="buyer-guide-dialog"
      aria-modal="true"
      aria-labelledby="buyer-guide-title"
      aria-describedby="buyer-guide-description"
      onCancel={(event) => {
        event.preventDefault()
        onChange('dismissed')
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onChange('dismissed')
      }}
    >
      <div className="buyer-guide-frame">
        <header className="buyer-guide-top">
          <span>
            <RangerMark /> EV Ranger
          </span>
          <button
            aria-label="Close guide"
            onClick={() => onChange('dismissed')}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>
        <div className="buyer-guide-body" ref={body}>
          <h2 id="buyer-guide-title" tabIndex={-1} ref={heading}>
            {page.title}
          </h2>
          <p id="buyer-guide-description">{page.body}</p>
          <FeaturePreview step={step} />
          {step === 'places' && (
            <p className="buyer-guide-note">
              Outlines use a distance budget. Detailed trip estimates can
              account for hills; outlines don’t yet.
            </p>
          )}
        </div>
        <footer className="buyer-guide-bottom">
          <div className="buyer-guide-progress">
            <button
              className="buyer-text-button"
              onClick={() => onChange('dismissed')}
            >
              Skip guide
            </button>
            {index >= 0 && (
              <span aria-label={`Step ${index + 1} of ${GUIDE_STEPS.length}`}>
                {index + 1} / {GUIDE_STEPS.length}
              </span>
            )}
          </div>
          <div className="buyer-guide-navigation">
            {step !== 'welcome' && (
              <button
                className="buyer-secondary"
                onClick={() => onChange(GUIDE_STEPS[index - 1] ?? 'welcome')}
              >
                <FiArrowLeft aria-hidden="true" /> Back
              </button>
            )}
            <button
              className="buyer-primary"
              onClick={() => {
                if (index === GUIDE_STEPS.length - 1) onFinish()
                else onChange(GUIDE_STEPS[index + 1])
              }}
            >
              {step === 'welcome'
                ? 'Take a look'
                : index === GUIDE_STEPS.length - 1
                  ? 'Start exploring'
                  : 'Next'}
              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  )
}
