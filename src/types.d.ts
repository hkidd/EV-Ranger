export interface CarVariant {
    id: string
    battery_size?: string[]
    wheels?: string[]
    name: string
    price?: number
    range: number
    adjustedRange?: number
    generation?: number
    rangeMaps?: RangeMaps
}

interface Car {
    id: string
    brand: string
    model: string
    variants: CarVariant[]
}

export interface SelectedCar {
    carId: string
    brand: string
    model: string
    variantName: string
    generation?: number
    battery: string
    wheel: string
    range: number
    color: string
    adjustedRange?: number
    sliderFraction: number
}

export interface RangeMaps {
    [battery: string]: {
        [wheel: string]: number // Range in miles
    }
}

export interface CarListProps {
    cars: Car[]
    filteredCars: Car[]
    selectedCars: SelectedCar[]
    onSelectionChange: (
        carId: string,
        variantName: string,
        generation: number | undefined,
        battery: string,
        wheel: string
    ) => void
    onDeselect: (
        carId: string,
        variantName: string,
        generation: number | undefined
    ) => void
    onRangeUpdate: (carId: string, adjustedRange: number) => void
    onColorChange?: (carId: string, newColor: string) => void
    externalTempAdjustment: boolean
    tempModifier: number
}

export interface CarCardProps {
    car: Car
    variant: CarVariant
    isSelected: boolean
    selectedCar: SelectedCar | undefined
    onSelectionChange: (
        carId: string,
        variantName: string,
        generation: number | undefined,
        battery: string,
        wheel: string
    ) => void
    onDeselect?: (
        carId: string,
        variantName: string,
        generation: number | undefined
    ) => void
    onRangeUpdate?: (carId: string, adjustedRange: number) => void
    onColorChange?: (carId: string, newColor: string) => void
    externalTempAdjustment: boolean
    tempModifier: number
}

export type ChipColorTypes =
    | 'danger'
    | 'primary'
    | 'warning'
    | 'success'
    | 'default'
    | 'secondary'
    | undefined
