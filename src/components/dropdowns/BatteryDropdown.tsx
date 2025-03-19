import React from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'
import { useTheme } from '../../context/ThemeContext'

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
  const { isDarkMode } = useTheme()

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          className={`px-4 py-2 text-sm rounded transition-colors ${
            isDarkMode
              ? 'bg-content2 text-foreground hover:bg-content3'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
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
          <DropdownItem key={battery}>{battery}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

export default BatteryDropdown
