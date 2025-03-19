import React from 'react'
import ReactJoyride, { CallBackProps, STATUS, Step } from 'react-joyride'

interface AppTourProps {
  run: boolean
  onTourComplete?: () => void
}

const steps: Step[] = [
  {
    target: '.mapboxgl-ctrl-geocoder',
    content: 'Start by searching for a location or address to fly to on the map'
  },
  {
    target: '.car-search-container',
    content: "Then select one or more EV's to plot and compare range values!"
  }
]

const AppTour: React.FC<AppTourProps> = ({ run, onTourComplete }) => {
  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data

    if (
      (status === STATUS.FINISHED || status === STATUS.SKIPPED) &&
      onTourComplete
    ) {
      onTourComplete()
    }
  }
  return (
    <ReactJoyride
      steps={steps}
      run={run}
      callback={handleTourCallback}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'End',
        next: 'Next',
        skip: 'Skip'
      }}
      styles={{
        beaconInner: {
          backgroundColor: '#4ECCA3'
        },
        beaconOuter: {
          backgroundColor: 'rgba(78, 204, 163, 0.3)'
        },
        options: {
          zIndex: 10000,
          primaryColor: '#1abc9c',
          textColor: '#333',
          backgroundColor: '#fff'
        },
        buttonNext: {
          backgroundColor: '#1abc9c',
          color: 'white'
        },
        buttonBack: {
          color: '#4ECCA3'
        },
        buttonSkip: {
          color: '#4ECCA3'
        }
      }}
    />
  )
}

export default AppTour
