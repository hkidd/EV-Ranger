import React from 'react'
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from '@nextui-org/react'
import { useTheme } from '../../context/ThemeContext'

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
    const { isDarkMode } = useTheme()

    return (
        <Dropdown>
            <DropdownTrigger>
                <button
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                        isDarkMode
                            ? 'bg-content2 text-foreground hover:bg-content3'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
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
