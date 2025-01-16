import { Checkbox, Tooltip } from '@nextui-org/react'
import { FaCircleInfo } from 'react-icons/fa6'

const ExtTempCheckbox = ({
  setExternalTempAdjustment
}: {
  setExternalTempAdjustment: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  return (
    <div className={`inline-flex items-center`}>
      <Checkbox
        defaultSelected={false}
        radius='full'
        classNames={{
          base: 'w-fit',
          label: 'text-xs',
          hiddenInput: 'w-fit'
        }}
        onChange={() => setExternalTempAdjustment((prev) => !prev)}
      >
        External temperature adjustment (estimate)
      </Checkbox>
      <Tooltip
        className='w-[200px] px-1.5 text-tiny rounded-small bg-primary text-white'
        content={
          <>
            In reality, the expected range of any given EV can vary based on a
            number of factors, including the temperature outside.
            <br />
            <br />
            This adjustment is not exact, but it can give you a rough idea of
            how the range of the vehicle might be affected by the temperature.
          </>
        }
        placement='top'
      >
        <span className='ml-2 hidden md:inline-flex'>
          <FaCircleInfo color='#4ECCA3' />
        </span>
      </Tooltip>
    </div>
  )
}

export default ExtTempCheckbox
