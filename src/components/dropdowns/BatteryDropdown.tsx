import React from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'

interface BatteryDropdownProps {
  selectedBattery: string
  batteries: string[]
  onSelect: (battery: string) => void
}

const BatteryDropdown: React.FC<BatteryDropdownProps> = ({
  selectedBattery,
  batteries,
  onSelect
}) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          className='px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300'
          onClick={(e) => e.stopPropagation()} // Prevent click propagation
        >
          Battery: {selectedBattery}
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label='Select Battery'
        onAction={(key) => onSelect(key as string)}
      >
        {batteries.map((battery) => (
          <DropdownItem key={battery}>
            {battery}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

export default BatteryDropdown
