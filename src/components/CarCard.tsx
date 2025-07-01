import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Slider,
    Tooltip,
    Chip
} from '@nextui-org/react'
import WheelDropdown from './dropdowns/WheelDropdown'
import BatteryDropdown from './dropdowns/BatteryDropdown'
import { HexColorPicker } from 'react-colorful'
import { CarCardProps } from '../types'
import { PiThermometerBold } from 'react-icons/pi'
import { FiX, FiZap } from 'react-icons/fi'

const CarCard: React.FC<CarCardProps> = ({
    car,
    variant,
    isSelected,
    selectedCar,
    onSelectionChange,
    onDeselect,
    onRangeUpdate,
    onColorChange,
    externalTempAdjustment,
    tempModifier
}) => {
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false)
    const [currentColor, setCurrentColor] = useState(
        selectedCar?.color || '#4ECCA3'
    )
    const [prevRange, setPrevRange] = useState<number | null>(null)
    const rangeRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (selectedCar?.color) {
            setCurrentColor(selectedCar.color)
        }
    }, [selectedCar])

    const handleBatterySelect = (key: string) => {
        onSelectionChange(
            variant.id,
            variant.name,
            variant.generation,
            key,
            selectedCar?.wheel ||
                ((variant.wheels ?? []).length > 0
                    ? (variant.wheels ?? [])[0]
                    : '')
        )
    }

    const handleWheelSelect = (key: string) => {
        onSelectionChange(
            variant.id,
            variant.name,
            variant.generation,
            selectedCar?.battery ||
                ((variant.battery_size ?? []).length > 0
                    ? (variant.battery_size ?? [])[0]
                    : ''),
            key
        )
    }

    const handleCardClick = () => {
        const defaultBattery =
            (variant.battery_size?.length ?? 0) > 0
                ? (variant.battery_size ?? [])[0]
                : ''
        const defaultWheel =
            variant.wheels && variant.wheels.length > 0 ? variant.wheels[0] : ''
        onSelectionChange(
            variant.id,
            variant.name,
            variant.generation,
            defaultBattery,
            defaultWheel
        )
    }

    const handleSliderChange = (value: number | number[]) => {
        const sliderValue = Array.isArray(value) ? value[0] : value
        const newFraction = sliderValue / 100

        if (onRangeUpdate) {
            onRangeUpdate(variant.id, newFraction)
        }
    }

    const getTempIcon = () => {
        if (!tempModifier) return null

        if (tempModifier >= 0.95) {
            return (
                <PiThermometerBold
                    className='text-success-500 ml-1'
                    size={14}
                />
            )
        } else if (tempModifier >= 0.85) {
            return (
                <PiThermometerBold
                    className='text-warning-500 ml-1'
                    size={14}
                />
            )
        } else {
            return (
                <PiThermometerBold className='text-danger-500 ml-1' size={14} />
            )
        }
    }

    const tempImpactPercent = useMemo(() => {
        if (!tempModifier || !externalTempAdjustment) return null
        return Math.round((tempModifier - 1) * 100)
    }, [tempModifier, externalTempAdjustment])

    const displayRange = useMemo(() => {
        let calculatedRange: number

        if (!isSelected || !selectedCar) {
            const base = variant.range
            calculatedRange = Math.round(
                base * (externalTempAdjustment ? tempModifier : 1)
            )
        } else {
            const baseRange = selectedCar.range
            const sliderFrac = selectedCar.sliderFraction ?? 1
            calculatedRange = Math.round(
                baseRange *
                    sliderFrac *
                    (externalTempAdjustment ? tempModifier : 1)
            )
        }

        if (
            prevRange !== null &&
            prevRange !== calculatedRange &&
            rangeRef.current
        ) {
            rangeRef.current.classList.add('animate-pulse')
            setTimeout(() => {
                if (rangeRef.current) {
                    rangeRef.current.classList.remove('animate-pulse')
                    setPrevRange(calculatedRange)
                }
            }, 500)
        }

        return calculatedRange
    }, [
        isSelected,
        selectedCar,
        variant.range,
        externalTempAdjustment,
        tempModifier,
        prevRange
    ])

    const handleColorChange = (color: string) => {
        setCurrentColor(color)
        if (onColorChange && selectedCar) {
            onColorChange(variant.id, color)
        }
    }

    return (
        <div
            onClick={handleCardClick}
            className={`w-full ${isSelected ? '' : 'cursor-pointer'}`}
        >
            <Card
                className={`
          w-full transition-all duration-300 ease-out shadow-md
          ${
              isSelected
                  ? 'ring-2 ring-primary/30 shadow-md shadow-primary/10 bg-primary/5 dark:bg-primary/10 border border-primary/20'
                  : 'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 border border-gray-200/50 dark:border-gray-700/50'
          }
        `}
                isPressable={false}
            >
                <CardHeader className='pb-3 pt-4 px-6 relative'>
                    {isSelected && (
                        <div className='absolute top-4 right-4 z-10'>
                            <Button
                                isIconOnly
                                size='sm'
                                variant='flat'
                                color='danger'
                                className='h-7 w-7 min-w-7 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50'
                                onPress={() =>
                                    onDeselect &&
                                    isSelected &&
                                    selectedCar &&
                                    onDeselect(
                                        variant.id,
                                        variant.name,
                                        variant.generation
                                    )
                                }
                            >
                                <FiX size={14} />
                            </Button>
                        </div>
                    )}

                    <div className='flex flex-col gap-1.5 w-full'>
                        <div className='flex items-center gap-2'>
                            <h3 className='text-lg font-semibold leading-tight text-foreground'>
                                {car.brand} {car.model}
                            </h3>
                            {isSelected && (
                                <Chip
                                    size='sm'
                                    color='primary'
                                    variant='flat'
                                    startContent={<FiZap size={12} />}
                                    className='bg-primary/10 text-primary font-medium'
                                >
                                    Active
                                </Chip>
                            )}
                        </div>

                        <div className='flex gap-0.5 items-center gap-4'>
                            <p className='text-sm font-medium text-foreground/80'>
                                {variant.name}
                                {variant.generation !== undefined && (
                                    <span className='text-foreground/60 ml-1'>
                                        · Gen {variant.generation}
                                    </span>
                                )}
                            </p>
                            <p className='text-xs text-foreground/60'>
                                Starting at $
                                {variant.price
                                    ? variant.price.toLocaleString()
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className='px-4 pb-3 pt-2'>
                    {/* Compact Range Display */}
                    <div className='flex items-center justify-between mb-3 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-md'>
                        <div className='flex items-center gap-2'>
                            <FiZap className='text-primary' size={12} />
                            <span className='text-xs text-foreground/70'>
                                Range:
                            </span>
                            <span
                                ref={rangeRef}
                                className='text-sm font-bold text-foreground transition-all duration-300'
                            >
                                {displayRange}
                            </span>
                            <span className='text-xs text-foreground/60'>
                                mi
                            </span>
                        </div>
                        {externalTempAdjustment && (
                            <Tooltip
                                content={
                                    tempImpactPercent && tempImpactPercent !== 0
                                        ? `Temperature impact: ${tempImpactPercent > 0 ? '+' : ''}${tempImpactPercent}%`
                                        : 'Optimal temperature'
                                }
                                className='bg-content1 text-foreground shadow-lg'
                            >
                                <div className='flex items-center'>
                                    {getTempIcon()}
                                </div>
                            </Tooltip>
                        )}
                    </div>

                    {isSelected && selectedCar && (
                        <div
                            className='space-y-2'
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Battery Level Slider - Compact */}
                            <div className='space-y-1'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-xs text-foreground/70'>
                                        Battery Level
                                    </span>
                                    <span className='text-xs font-semibold text-primary'>
                                        {Math.round(
                                            (selectedCar.sliderFraction || 1) *
                                                100
                                        )}
                                        %
                                    </span>
                                </div>
                                <Slider
                                    aria-label='Battery Level'
                                    minValue={0}
                                    maxValue={100}
                                    value={
                                        (selectedCar.sliderFraction || 1) * 100
                                    }
                                    onChange={handleSliderChange}
                                    color='primary'
                                    step={1}
                                    className='max-w-full'
                                    showTooltip
                                />
                            </div>

                            {/* Dropdowns - Prominent Display */}
                            <div className='bg-content1/50 p-2 rounded-md space-y-2'>
                                <div className='text-xs font-medium text-foreground/80 mb-1'>
                                    Configuration
                                </div>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <label className='text-xs text-foreground/60 block mb-1'>
                                            Battery
                                        </label>
                                        <BatteryDropdown
                                            onSelect={handleBatterySelect}
                                            selectedBattery={
                                                selectedCar?.battery ||
                                                (variant.battery_size ?? [])[0]
                                            }
                                            batteries={
                                                variant.battery_size ?? []
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className='text-xs text-foreground/60 block mb-1'>
                                            Wheels
                                        </label>
                                        <WheelDropdown
                                            onSelect={handleWheelSelect}
                                            selectedWheel={
                                                selectedCar?.wheel ||
                                                (variant.wheels ?? [])[0]
                                            }
                                            wheels={variant.wheels ?? []}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color Picker - Modern */}
                            <div className='bg-content1/50 p-2 rounded-md'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-xs font-medium text-foreground/80'>
                                        Visualization Color
                                    </span>
                                    <Button
                                        size='sm'
                                        variant='flat'
                                        color='primary'
                                        startContent={
                                            <div
                                                className='w-3 h-3 rounded-full border border-white shadow-sm'
                                                style={{
                                                    backgroundColor:
                                                        currentColor
                                                }}
                                            />
                                        }
                                        onClick={() =>
                                            setIsColorPickerVisible(
                                                !isColorPickerVisible
                                            )
                                        }
                                        className='h-6 px-2 min-w-16 bg-primary/10 hover:bg-primary/20 text-primary font-medium'
                                    >
                                        <span className='text-xs'>
                                            {isColorPickerVisible
                                                ? 'Close'
                                                : 'Edit'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            {isColorPickerVisible && (
                                <div className='bg-content1/50 p-3 rounded-md border border-gray-200/30 dark:border-gray-700/30 space-y-3'>
                                    <HexColorPicker
                                        color={currentColor}
                                        onChange={handleColorChange}
                                        style={{
                                            width: '100%',
                                            height: '100px'
                                        }}
                                    />
                                    <div className='flex items-center gap-2'>
                                        <input
                                            type='text'
                                            value={currentColor}
                                            onChange={(e) =>
                                                handleColorChange(
                                                    e.target.value
                                                )
                                            }
                                            className='flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-content2 text-foreground font-mono transition-colors focus:border-primary/60'
                                            placeholder='#4ECCA3'
                                        />
                                        <Button
                                            size='sm'
                                            color='primary'
                                            variant='flat'
                                            onPress={() =>
                                                setIsColorPickerVisible(false)
                                            }
                                            className='px-3 min-w-12 h-8 bg-primary/10 hover:bg-primary/20 text-primary'
                                        >
                                            <span className='text-xs'>
                                                Done
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    )
}

export default CarCard
