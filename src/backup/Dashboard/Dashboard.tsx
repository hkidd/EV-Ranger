import React, { useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
import SearchMap from '../../components/map/SearchMap'
import CarList from '../../components/CarList'
import { getRandomColor } from '../../utils/helpers'
import { useCarsQuery } from '../../queries/carQuery'
import { CarListSkeleton, Skeleton } from '../../components/skeletons/index'
import { Car, SelectedCar } from '../../types'
import { getRangeValue } from '../../utils/getRangeValue'
import { CarVariant } from '../../types.d'
import ExternalTempModifier from '../../components/ExternalTempModifier'
import ExtTempCheckbox from '../../components/ExtTempCheckbox'
import { useTemp } from '../../context/TempContext'

const Dashboard: React.FC = () => {
  const [selectedCars, setSelectedCars] = useState<SelectedCar[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [externalTempAdjustment, setExternalTempAdjustment] = useState(false)
  const [isMapVisible, setIsMapVisible] = useState(true)

  const { data: cars = [], isLoading, isError } = useCarsQuery()
  const { externalTemp, calculateTempModifier } = useTemp()

  // Calculate temperature modifier
  const tempModifier = calculateTempModifier(externalTemp)

  const handleToggleMap = () => {
    setIsMapVisible(!isMapVisible)
  }

  const filteredCars = useMemo(() => {
    return searchQuery
      ? cars.filter((car: Car) =>
          `${car.brand} ${car.model}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : cars
  }, [cars, searchQuery])

  const handleFilter = (query: string) => {
    setSearchQuery(query)
  }

  const handleSelectionChange = (
    carId: string,
    variantName: string,
    generation: number | undefined,
    battery: string,
    wheel: string
  ) => {
    const car = cars.find((c: Car) =>
      c.variants.some((v: CarVariant) => v.id === carId)
    )
    if (!car) {
      return
    }

    const variant = car.variants.find(
      (v) =>
        v.name === variantName &&
        (generation ? v.generation === generation : true)
    )

    if (!variant) {
      return
    }

    const range = getRangeValue(variant, battery, wheel)
    if (range === null) {
      return
    }

    setSelectedCars((prev) => {
      const existingIndex = prev.findIndex(
        (c) =>
          c.carId === carId &&
          c.variantName === variantName &&
          c.generation === generation
      )

      if (existingIndex !== -1) {
        // Update existing selection
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          battery,
          wheel,
          range,
          adjustedRange: range
        }
        return updated
      } else {
        return [
          ...prev,
          {
            carId,
            brand: car.brand,
            model: car.model,
            variantName,
            generation,
            battery,
            wheel,
            range,
            adjustedRange: range, // Initialize with original range
            color: getRandomColor(),
            sliderFraction: 1
          }
        ]
      }
    })
  }

  const handleDeselect = (
    carId: string,
    variantName: string,
    generation: number | undefined
  ) => {
    setSelectedCars((prev) =>
      prev.filter(
        (c) =>
          !(
            c.carId === carId &&
            c.variantName === variantName &&
            c.generation === generation
          )
      )
    )
  }

  const handleRangeUpdate = (carId: string, fraction: number) => {
    setSelectedCars((prev) =>
      prev.map((car) =>
        car.carId === carId ? { ...car, sliderFraction: fraction } : car
      )
    )
  }

  const handleColorChange = (carId: string, newColor: string) => {
    const currentSelections = [...selectedCars].map((sc) => {
      if (sc.carId === carId) {
        return { ...sc, color: newColor }
      }
      return sc
    })
    setSelectedCars(currentSelections)
  }

  if (isLoading) {
    return (
      <div className='flex flex-col md:flex-row h-screen-minus-header relative'>
        {/* Map section Skeleton */}
        <div className='order-1 md:order-2 w-full md:w-2/3 h-1/2 md:h-full relative z-0'>
          <Skeleton className='w-full h-full rounded-lg' />
        </div>
        {/* Search section Skeleton */}
        <div className='order-2 md:order-1 w-full md:w-1/3 flex flex-col bg-background dark:bg-background z-10 h-1/2 md:h-full overflow-auto p-6'>
          {/* Search Input Skeleton */}
          <Skeleton className='h-10 w-3/4 mb-6 rounded' />
          {/* CarList Header Skeleton */}
          <Skeleton className='h-6 w-1/2 mb-4 rounded' />
          {/* CarList Skeleton */}
          <CarListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col md:flex-row h-screen-minus-header relative'>
      <div
        className={`order-1 md:order-2 w-full md:w-2/3 ${isMapVisible ? 'h-1/2' : 'h-0'} ${isMapVisible ? 'block' : 'hidden'} md:h-full relative z-0`}
      >
        <SearchMap
          selectedCars={selectedCars}
          externalTempAdjustment={externalTempAdjustment}
          tempModifier={tempModifier}
        />
      </div>
      <div
        className={`order-2 md:order-1 w-full md:w-1/3 flex flex-col bg-background dark:bg-background z-10 ${isMapVisible ? 'h-1/2' : 'h-full'} md:h-full overflow-auto md:px-0`}
      >
        <div>
          <SearchInput
            onFilter={handleFilter}
            handleToggleMap={handleToggleMap}
            isMapVisible={isMapVisible}
          />
        </div>
        {isError ? (
          <div className='text-red-500 text-center mt-4 p-6'>
            Error loading vehicles.
          </div>
        ) : (
          <>
            <div className='flex flex-col px-6 py-4 md:p-6 pt-0'>
              <ExtTempCheckbox
                setExternalTempAdjustment={setExternalTempAdjustment}
                externalTempAdjustment={externalTempAdjustment}
              />
              {externalTempAdjustment ? <ExternalTempModifier /> : null}
            </div>
            <div className='flex-grow overflow-auto p-6 pt-0'>
              <CarList
                cars={cars}
                filteredCars={filteredCars}
                selectedCars={selectedCars}
                onSelectionChange={handleSelectionChange}
                onDeselect={handleDeselect}
                onRangeUpdate={handleRangeUpdate}
                onColorChange={handleColorChange}
                externalTempAdjustment={externalTempAdjustment}
                tempModifier={tempModifier}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
