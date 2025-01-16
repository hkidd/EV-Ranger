import React, { useContext, useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
import SearchMap from '../../components/Maps/SearchMap'
import CarList from '../../components/CarList'
import { getRandomColor } from '../../utils/helpers'
import { useCarsQuery } from '../../queries/carQuery'
import { CarListSkeleton, Skeleton } from '../../components/skeletons/index'
import { Car, SelectedCar } from '../../types'
import { getRangeValue } from '../../utils/getRangeValue'
import { CarVariant } from '../../types.d'
import ExternalTempModifier from '../../components/ExternalTempModifier'
import ExtTempCheckbox from '../../components/ExtTempCheckbox'
import { TempContext } from '../../context/TempContext'
import { getTempModifier } from '../../utils/temperatureModifier'

const Dashboard: React.FC = () => {
  const [selectedCars, setSelectedCars] = useState<SelectedCar[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [externalTempAdjustment, setExternalTempAdjustment] = useState(false)

  const { data: cars = [], isLoading, isError } = useCarsQuery()

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

  const tempContext = useContext(TempContext)
  if (!tempContext) {
    throw new Error('CarCard must be used within a TempProvider')
  }
  const { externalTemp } = tempContext
  const tempModifier = getTempModifier(externalTemp)

  if (isLoading) {
    return (
      <div className='flex flex-col md:flex-row h-[calc(100vh-5rem)] relative'>
        {/* Map section Skeleton */}
        <div className='order-1 md:order-2 w-full md:w-2/3 h-1/2 md:h-full relative z-0'>
          <Skeleton className='w-full h-full rounded-lg' />
        </div>
        {/* Search section Skeleton */}
        <div className='order-2 md:order-1 w-full md:w-1/3 flex flex-col bg-white z-10 h-1/2 md:h-full overflow-auto p-6'>
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
    <div className='flex flex-col md:flex-row h-[calc(100vh-4rem)] relative'>
      <div className='order-1 md:order-2 w-full md:w-2/3 h-1/2 md:h-full relative z-0'>
        <SearchMap
          selectedCars={selectedCars}
          externalTempAdjustment={externalTempAdjustment}
          tempModifier={tempModifier}
        />
      </div>
      <div className='order-2 md:order-1 w-full md:w-1/3 flex flex-col bg-white z-10 h-1/2 md:h-full overflow-auto'>
        <div>
          <SearchInput onFilter={handleFilter} />
        </div>
        {isError ? (
          <div className='text-red-500 text-center mt-4 p-6'>
            Error loading vehicles.
          </div>
        ) : (
          <>
            <div className='flex flex-col p-6 pt-0'>
              <ExtTempCheckbox
                setExternalTempAdjustment={setExternalTempAdjustment}
              />
              {externalTempAdjustment ? <ExternalTempModifier /> : null}
            </div>
            <div className='flex-1 overflow-auto p-6 pt-0'>
              <CarList
                cars={filteredCars}
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
