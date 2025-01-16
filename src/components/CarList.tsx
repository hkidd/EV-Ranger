import React from 'react'
import CarCard from './CarCard'
import { Car, CarListProps, CarVariant, SelectedCar } from '../types'

const CarList: React.FC<CarListProps> = ({
  cars,
  selectedCars,
  onSelectionChange,
  onDeselect,
  onRangeUpdate,
  onColorChange,
  externalTempAdjustment,
  tempModifier
}) => {
  const isVariantSelected = (
    carId: string,
    variantName: string,
    generation: number | undefined
  ): boolean => {
    return selectedCars.some(
      (c) =>
        c.carId === carId &&
        c.variantName === variantName &&
        c.generation === generation
    )
  }

  const selectedVariants = selectedCars
    .map((selectedCar) => {
      const car = cars.find((c: Car) =>
        c.variants.some((v: CarVariant) => v.id === selectedCar.carId)
      )
      if (!car) return null
      const variant = car.variants.find(
        (v) =>
          v.name === selectedCar.variantName &&
          v.generation === selectedCar.generation
      )
      if (!variant) return null
      return { car, variant, selectedCar }
    })
    .filter((item) => item !== null) as {
    car: Car
    variant: CarVariant
    selectedCar: SelectedCar
  }[]

  const availableVariants = cars.flatMap((car) =>
    car.variants
      .filter(
        (variant) =>
          !isVariantSelected(variant.id, variant.name, variant.generation)
      )
      .map((variant) => ({ car, variant }))
  )

  return (
    <div className='flex flex-col gap-2'>
      {selectedVariants.length > 0 && (
        <div>
          <h2 className='text-sm font-semibold mb-4'>Selected Cars</h2>
          <div className='flex flex-col gap-4'>
            {selectedVariants.map(({ car, variant, selectedCar }) => (
              <CarCard
                key={`${car.id}-${variant.name}-${variant.generation}`}
                car={car}
                variant={variant}
                isSelected={true}
                selectedCar={selectedCar}
                onSelectionChange={onSelectionChange}
                onDeselect={onDeselect}
                onRangeUpdate={onRangeUpdate}
                onColorChange={onColorChange}
                externalTempAdjustment={externalTempAdjustment}
                tempModifier={tempModifier}
              />
            ))}
          </div>
        </div>
      )}
      {selectedVariants.length > 0 && availableVariants.length > 0 && (
        <hr className='my-2 border-gray-300' />
      )}
      <div>
        {selectedVariants.length > 0 && (
          <h2 className='text-sm font-semibold mb-4'>Available Cars</h2>
        )}
        <div className='flex flex-col gap-4'>
          {availableVariants.map(({ car, variant }) => (
            <CarCard
              key={`${car.id}-${variant.name}-${variant.generation}`}
              car={car}
              variant={variant}
              isSelected={false}
              selectedCar={undefined}
              onSelectionChange={onSelectionChange}
              externalTempAdjustment={externalTempAdjustment}
              tempModifier={tempModifier}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CarList
