import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardBody, Slider, Divider } from '@nextui-org/react'
import WheelDropdown from './dropdowns/WheelDropdown'
import BatteryDropdown from './dropdowns/BatteryDropdown'
import { HexColorPicker } from 'react-colorful'
import { CarCardProps } from '../types'
import { PiThermometerBold } from 'react-icons/pi'

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
    if (isSelected && selectedCar && onDeselect) {
      onDeselect(variant.id, variant.name, variant.generation)
    } else {
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
  }

  const handleSliderChange = (value: number) => {
    const fraction = value / 100
    // We only store the fraction in state, not the temperature-adjusted final.
    if (onRangeUpdate) {
      onRangeUpdate(variant.id, fraction)
    }
  }

  const displayRange = useMemo(() => {
    if (!isSelected || !selectedCar) {
      // fallback to base variant range
      const base = variant.range
      return Math.round(base * (externalTempAdjustment ? tempModifier : 1))
    }

    // selectedCar is chosen.
    // Convert the slider fraction to a final range.
    const baseRange = selectedCar.range
    const sliderFrac = selectedCar.sliderFraction ?? 1
    const finalRange =
      baseRange * sliderFrac * (externalTempAdjustment ? tempModifier : 1)

    return Math.round(finalRange)
  }, [
    isSelected,
    selectedCar,
    variant.range,
    externalTempAdjustment,
    tempModifier
  ])

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    if (onColorChange && selectedCar) {
      onColorChange(variant.id, color)
    }
  }

  return (
    <div onClick={handleCardClick} className='cursor-pointer'>
      <Card
        isHoverable
        className={`shadow-md transition-shadow ${
          isSelected ? 'border-2' : 'border'
        } ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}
        style={{
          borderColor: isSelected ? selectedCar?.color || 'blue' : 'lightgrey'
        }}
      >
        <CardHeader className='flex-col items-start py-2'>
          <h2 className='text-md font-bold'>
            {car.brand} {car.model} - {variant.name}{' '}
            {variant.generation !== undefined
              ? `(Gen ${variant.generation})`
              : ''}
          </h2>
          <p className='text-gray-600 text-xs'>
            Approx. starting price: $
            {variant.price ? variant.price.toLocaleString() : 'N/A'} USD
          </p>
        </CardHeader>
        <Divider />
        <CardBody className='py-2'>
          <p className='text-xs inline-flex items-center'>
            Range: <span className='font-bold mx-1'>{displayRange} miles</span>{' '}
            (EPA est.)
            {externalTempAdjustment ? (
              <PiThermometerBold className='mx-1' color='#4ECCA3' />
            ) : null}
          </p>
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
                    <p className='text-xs text-gray-500'>
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
                    <p className='text-xs text-gray-500'>
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
                  className={`px-2 py-1 text-[${currentColor}] rounded flex items-center`}
                >
                  {isColorPickerVisible ? (
                    ''
                  ) : (
                    <div
                      className='w-4 h-4'
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
                      className='px-2 py-1 text-gray-600 text-xs rounded mt-2'
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
