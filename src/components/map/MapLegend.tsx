import React, { useRef, useState } from 'react'

// Define the LegendItem interface directly in this file
interface LegendItem {
  carId: string
  brand: string
  model: string
  variantName: string
  color: string
  range: number
}

interface MapLegendProps {
  legendItems: LegendItem[]
  onClose?: () => void
}

const MapLegend: React.FC<MapLegendProps> = ({ legendItems, onClose }) => {
  const legendRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Hide legend if no items
  if (legendItems.length === 0) return null

  return (
    <div
      className='absolute bottom-14 right-8 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 max-w-xs transform transition-all duration-200'
      ref={legendRef}
      style={{ maxWidth: '240px' }}
    >
      {/* Title bar with toggle */}
      <div
        className='flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer'
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className='font-bold text-sm flex items-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4 mr-1'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
            />
          </svg>
          Driving Range
        </div>
        <div className='flex items-center'>
          <button
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1'
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4 transform transition-transform'
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
          <button
            className='ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1'
            onClick={(e) => {
              e.stopPropagation()
              if (onClose) {
                onClose()
              } else if (legendRef.current) {
                legendRef.current.style.display = 'none'
              }
            }}
            aria-label='Close legend'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Legend content - hidden when collapsed */}
      <div className={`p-3 space-y-2 ${isCollapsed ? 'hidden' : 'block'}`}>
        {legendItems.map((item) => (
          <div key={item.carId} className='flex flex-col space-y-1'>
            <div className='flex items-center'>
              {/* Color swatch */}
              <div
                className='w-3.5 h-3.5 mr-2 flex-shrink-0 rounded border border-gray-300 dark:border-gray-600'
                style={{ backgroundColor: item.color }}
                aria-hidden='true'
              />

              {/* Car name */}
              <div className='font-medium text-xs flex-1 truncate'>
                {item.brand} {item.model} - {item.variantName}
              </div>
            </div>

            {/* Range details */}
            <div className='pl-5 text-xs text-gray-600 dark:text-gray-400 flex flex-col space-y-1'>
              <div className='flex justify-between'>
                <span>Max Range:</span>
                <span className='font-medium'>
                  {Math.round(item.range)} miles
                </span>
              </div>
              <div className='text-[10px] italic'>
                Range visualization based on road network and driving distances
              </div>
            </div>

            {/* Divider between cars */}
            {legendItems.indexOf(item) < legendItems.length - 1 && (
              <div className='border-b border-gray-100 dark:border-gray-700 my-1'></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MapLegend
