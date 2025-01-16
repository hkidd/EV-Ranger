import React from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'

interface WheelDropdownProps {
  selectedWheel: string
  wheels: string[]
  onSelect: (battery: string) => void
}

const WheelDropdown: React.FC<WheelDropdownProps> = ({
  selectedWheel,
  wheels,
  onSelect
}) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          className='px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300'
          onClick={(e) => e.stopPropagation()} // Prevent click propagation
        >
          Wheels: {selectedWheel}
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label='Select Wheels'
        onAction={(key) => onSelect(key as string)}
      >
        {wheels.map((wheel) => (
          <DropdownItem key={wheel}>{wheel}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

export default WheelDropdown
