import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Slider,
  Divider,
  Tooltip
} from '@nextui-org/react'
import WheelDropdown from './dropdowns/WheelDropdown'
import BatteryDropdown from './dropdowns/BatteryDropdown'
import { HexColorPicker } from 'react-colorful'
import { CarCardProps } from '../types'
import {
  PiThermometerBold,
  PiThermometerCold,
  PiThermometerHot
} from 'react-icons/pi'
import { FiX } from 'react-icons/fi'

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
        ((variant.wheels ?? []).length > 0 ? (variant.wheels ?? [])[0] : '')
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

  const handleSliderChange = (value: number) => {
    const fraction = value / 100
    // We only store the fraction in state, not the temperature-adjusted final.
    if (onRangeUpdate) {
      onRangeUpdate(variant.id, fraction)
    }
  }

  const displayRange = useMemo(() => {
    // Store previous range for animation effect
    if (prevRange === null) {
      setPrevRange(variant.range)
    }

    let calculatedRange: number

    if (!isSelected || !selectedCar) {
      // fallback to base variant range
      const base = variant.range
      calculatedRange = Math.round(
        base * (externalTempAdjustment ? tempModifier : 1)
      )
    } else {
      // selectedCar is chosen.
      // Convert the slider fraction to a final range.
      const baseRange = selectedCar.range
      const sliderFrac = selectedCar.sliderFraction ?? 1
      calculatedRange = Math.round(
        baseRange * sliderFrac * (externalTempAdjustment ? tempModifier : 1)
      )
    }

    // Animate range change if different from previous
    if (
      prevRange !== null &&
      prevRange !== calculatedRange &&
      rangeRef.current
    ) {
      // Add animation class
      rangeRef.current.classList.add('animate-pulse')

      // Remove animation class after animation completes
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

  // Get temperature impact icon
  const getTempIcon = () => {
    if (!externalTempAdjustment) return null

    if (tempModifier >= 0.95) {
      return <PiThermometerBold className='text-success' />
    } else if (tempModifier >= 0.8) {
      return <PiThermometerHot className='text-warning' />
    } else {
      return <PiThermometerCold className='text-danger' />
    }
  }

  // Calculate percentage impact of temperature on range
  const tempImpactPercent = useMemo(() => {
    if (!externalTempAdjustment) return null
    return Math.round((tempModifier - 1) * 100)
  }, [externalTempAdjustment, tempModifier])

  return (
    <div
      onClick={handleCardClick}
      className={`${isSelected ? '' : 'cursor-pointer'}`}
    >
      <Card
        isHoverable={isSelected ? false : true}
        className={`shadow-md transition-shadow ${
          isSelected ? 'border-2' : 'border'
        } ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}
        style={{
          borderColor: isSelected ? selectedCar?.color || 'blue' : 'lightgrey'
        }}
      >
        <CardHeader className='relative flex-col items-start py-2'>
          {isSelected ? (
            <div className='w-full flex justify-end'>
              <Button
                onPress={() =>
                  onDeselect &&
                  isSelected &&
                  selectedCar &&
                  onDeselect(variant.id, variant.name, variant.generation)
                }
                className='text-white hover:text-secondary flex bg-primary h-5 w-5 p-0 m-0 -mb-6'
                size='sm'
                isIconOnly
              >
                <FiX size={15} />
              </Button>
            </div>
          ) : null}
          <h2 className='text-md font-bold w-5/6'>
            {car.brand} {car.model} - {variant.name}{' '}
            {variant.generation !== undefined
              ? `(Gen ${variant.generation})`
              : ''}
          </h2>
          <p className='text-gray-600 dark:text-gray-400 text-xs w-5/6'>
            Approx. starting price: $
            {variant.price ? variant.price.toLocaleString() : 'N/A'} USD
          </p>
        </CardHeader>
        <Divider />
        <CardBody className='py-2'>
          <div className='text-xs flex items-center justify-between'>
            <div className='flex items-center'>
              <span className='text-gray-600 dark:text-gray-400'>Range:</span>
              <span
                ref={rangeRef}
                className='font-bold mx-1 transition-all duration-300'
              >
                {displayRange} miles
              </span>
              <span className='text-gray-600 dark:text-gray-400'>
                (EPA est.)
              </span>
            </div>

            {externalTempAdjustment && (
              <Tooltip
                content={
                  tempImpactPercent && tempImpactPercent !== 0
                    ? `Temperature impact: ${tempImpactPercent > 0 ? '+' : ''}${tempImpactPercent}%`
                    : 'Optimal temperature'
                }
              >
                <div className='flex items-center'>{getTempIcon()}</div>
              </Tooltip>
            )}
          </div>

          {isSelected && selectedCar && (
            <div className='mt-2' onClick={(e) => e.stopPropagation()}>
              <Slider
                aria-label='Range Adjustment'
                minValue={0}
                maxValue={100}
                step={1}
                defaultValue={100}
                onChange={(value) => {
                  const newValue = Array.isArray(value) ? value[0] : value
                  handleSliderChange(newValue)
                }}
                label={`Adjust Range (%)`}
                showTooltip
              />
            </div>
          )}
          {isSelected && selectedCar && (
            <div
              className={`flex items-center gap-2 mt-1 ${isColorPickerVisible ? 'justify-center' : 'justify-between'}`}
            >
              {!isColorPickerVisible && (
                <>
                  {(variant.battery_size ?? []).length > 0 ? (
                    <BatteryDropdown
                      onSelect={handleBatterySelect}
                      selectedBattery={
                        selectedCar?.battery || (variant.battery_size ?? [])[0]
                      }
                      batteries={variant.battery_size ?? []}
                    />
                  ) : (
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      No battery options available.
                    </p>
                  )}
                  {(variant.wheels ?? []).length > 0 ? (
                    <WheelDropdown
                      onSelect={handleWheelSelect}
                      selectedWheel={
                        selectedCar?.wheel || (variant.wheels ?? [])[0]
                      }
                      wheels={variant.wheels ?? []}
                    />
                  ) : (
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      No wheel options available.
                    </p>
                  )}
                </>
              )}
              <div className='flex items-center'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsColorPickerVisible(!isColorPickerVisible)
                  }}
                  className={`px-2 py-1 rounded flex items-center`}
                >
                  {isColorPickerVisible ? (
                    ''
                  ) : (
                    <div
                      className='w-4 h-4 rounded-full border border-gray-300'
                      style={{ backgroundColor: currentColor }}
                    />
                  )}
                </button>
                {isColorPickerVisible && (
                  <div
                    className='flex flex-col mt-2 justify-center'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HexColorPicker
                      color={currentColor}
                      onChange={handleColorChange}
                    />
                    <button
                      onClick={() => setIsColorPickerVisible(false)}
                      className='px-2 py-1 text-gray-600 dark:text-gray-400 text-xs rounded mt-2'
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default CarCard
