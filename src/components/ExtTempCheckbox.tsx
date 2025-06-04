import React from 'react'
import { Checkbox, Tooltip } from '@nextui-org/react'
import { FaCircleInfo } from 'react-icons/fa6'
import { useTemp } from '../context/TempContext'

interface ExtTempCheckboxProps {
  setExternalTempAdjustment: React.Dispatch<React.SetStateAction<boolean>>
  externalTempAdjustment: boolean
}

const ExtTempCheckbox: React.FC<ExtTempCheckboxProps> = ({
  setExternalTempAdjustment,
  externalTempAdjustment
}) => {
  const { externalTemp, tempUnit } = useTemp()

  return (
    <div
      className={`inline-flex items-center gap-2 ${externalTempAdjustment ? 'pb-2' : ''}`}
    >
      <Checkbox
        isSelected={externalTempAdjustment}
        radius='full'
        classNames={{
          base: 'w-fit',
          label: 'text-xs',
          hiddenInput: 'w-fit'
        }}
        onChange={() => setExternalTempAdjustment((prev) => !prev)}
      >
        External temperature adjustment
      </Checkbox>

      <Tooltip
        className='w-[250px] px-2 py-2 text-tiny rounded-md bg-content1 border border-default-200'
        content={
          <>
            <p>
              EV range figures are affected by temperature. This adjustment
              provides an estimate of how the current temperature (
              {externalTemp}°{tempUnit}) might impact your vehicle's range.
            </p>
            <ul className='list-disc pl-4 mt-1 text-[10px]'>
              <li>
                Cold temperatures (below 32°F/0°C) can reduce range by up to 50%
              </li>
              <li>Optimal range is typically around 70-75°F (21-24°C)</li>
              <li>
                Hot temperatures (above 95°F/35°C) can reduce range by up to 15%
              </li>
            </ul>
          </>
        }
        placement='top'
        showArrow={true}
      >
        <span className='ml-0.5 cursor-help'>
          <FaCircleInfo size={13} className='text-primary' />
        </span>
      </Tooltip>
    </div>
  )
}

export default ExtTempCheckbox
