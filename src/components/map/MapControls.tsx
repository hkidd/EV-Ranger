import React from 'react'
import { HiOutlineMap } from 'react-icons/hi'

interface MapControlsProps {
  map: mapboxgl.Map | null
  onToggleSatellite: () => void
  satelliteActive: boolean
  // onToggleChargingStations?: () => void
  // chargingStationsActive?: boolean
}

const MapControls: React.FC<MapControlsProps> = ({
  map,
  onToggleSatellite,
  satelliteActive
  // onToggleChargingStations,
  // chargingStationsActive = false
}) => {
  if (!map) return null

  return (
    <div className='absolute top-[30px] left-64 mt-1 ml-1 flex gap-2'>
      {/* Satellite Toggle */}
      <button
        className={`flex justify-center items-center p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ${
          satelliteActive ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        onClick={onToggleSatellite}
        title='Toggle satellite view'
      >
        <HiOutlineMap className='w-5 h-5 text-gray-700 dark:text-gray-200' />
      </button>

      {/* Charging Stations Toggle */}
      {/* {onToggleChargingStations && (
        <button
          className={`flex justify-center items-center p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 ${
            chargingStationsActive ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={onToggleChargingStations}
          title='Toggle charging stations'
        >
          <HiOutlineLocationMarker className='w-5 h-5 text-gray-700 dark:text-gray-200' />
        </button>
      )} */}
    </div>
  )
}

export default MapControls
