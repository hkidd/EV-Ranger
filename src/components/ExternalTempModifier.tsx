import React, { useContext } from 'react'
import { TempContext } from '../context/TempContext'
import { Slider } from '@nextui-org/react'

const ExternalTempModifier: React.FC = () => {
  const tempContext = useContext(TempContext)
  if (!tempContext) {
    throw new Error('ExternalTempModifier must be used within a TempProvider')
  }
  const { externalTemp, setExternalTemp } = tempContext

  const handleTempChange = (value: number | number[]) => {
    const newTemp = Array.isArray(value) ? value[0] : value
    if (newTemp !== undefined) {
      setExternalTemp(newTemp)
    }
  }

  return (
    <div className='external-temp-modifier'>
      <Slider
        aria-label='External Temperature Modifier'
        minValue={-20}
        maxValue={120}
        step={1}
        value={[externalTemp]} // Controlled value as an array
        onChange={handleTempChange}
        showTooltip
        renderValue={() => `${externalTemp}°F`}
        hideValue={false}
      />
      <p className='text-default-500 font-medium text-xs'>
        Temp: {externalTemp}°F
      </p>
    </div>
  )
}

export default ExternalTempModifier
