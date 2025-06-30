import React from 'react'
import { Slider, Button, Tooltip } from '@nextui-org/react'
import { useTemp } from '../context/TempContext'
import { BsThermometerHalf } from 'react-icons/bs'
import { MdSwapHoriz } from 'react-icons/md'
import { useTheme } from '../context/ThemeContext'

const ExternalTempModifier: React.FC = () => {
    const {
        externalTemp,
        setExternalTemp,
        tempUnit,
        toggleTempUnit,
        getDisplayTemp,
        calculateTempModifier
    } = useTemp()

    const { isDarkMode } = useTheme()

    const handleTempChange = (value: number | number[]) => {
        const newTemp = Array.isArray(value) ? value[0] : value
        if (newTemp !== undefined) {
            setExternalTemp(newTemp)
        }
    }

    // Get min and max values based on the current temperature unit
    const getMinMaxValues = () => {
        if (tempUnit === 'F') {
            return { min: -20, max: 120 }
        } else {
            return { min: -29, max: 49 }
        }
    }

    const { min, max } = getMinMaxValues()

    // Calculate efficiency percentage for display
    const efficiencyPercentage = Math.round(
        calculateTempModifier(externalTemp) * 100
    )

    // Determine badge styling based on efficiency
    const getBadgeStyles = () => {
        const baseClass =
            'text-xs px-2 py-1 rounded-full flex items-center justify-center'

        if (efficiencyPercentage >= 95) {
            return `${baseClass} ${isDarkMode ? 'bg-success-500/20 text-success-500' : 'bg-success-100 text-success-700'}`
        } else if (efficiencyPercentage >= 85) {
            return `${baseClass} ${isDarkMode ? 'bg-warning-500/20 text-warning-500' : 'bg-warning-100 text-warning-700'}`
        } else {
            return `${baseClass} ${isDarkMode ? 'bg-danger-500/20 text-danger-500' : 'bg-danger-100 text-danger-700'}`
        }
    }

    return (
        <div className='external-temp-modifier p-2 bg-content1 dark:bg-content1 rounded-lg border border-default-200 dark:border-default-100'>
            <div className='flex justify-between items-center mb-2'>
                <div className='flex items-center'>
                    <BsThermometerHalf className='mr-2 text-primary' />
                    <span className='text-sm font-medium text-foreground dark:text-foreground'>
                        External Temperature
                    </span>
                </div>
                <Button
                    size='sm'
                    variant='light'
                    isIconOnly
                    onClick={toggleTempUnit}
                    aria-label={`Switch to ${tempUnit === 'F' ? 'Celsius' : 'Fahrenheit'}`}
                >
                    <div className='flex items-center'>
                        <span className='text-xs'>{tempUnit}</span>
                        <MdSwapHoriz size={14} />
                    </div>
                </Button>
            </div>

            <div className='flex-col'>
                <Slider
                    aria-label='External Temperature Modifier'
                    minValue={min}
                    maxValue={max}
                    step={1}
                    value={[externalTemp]}
                    onChange={handleTempChange}
                    showTooltip
                    className='mb-2'
                />

                <div className='flex justify-between items-center'>
                    <p className='text-foreground dark:text-foreground font-medium text-sm'>
                        {getDisplayTemp()}
                    </p>

                    <Tooltip content='How temperature affects EV range'>
                        <div className={getBadgeStyles()}>
                            {efficiencyPercentage}% Efficiency
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

export default ExternalTempModifier
