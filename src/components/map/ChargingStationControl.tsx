import React, { useState } from 'react'
import { ChargingStationFilters } from '../../hooks/useChargingStations'
import { MdEvStation } from 'react-icons/md'
import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2'
import { Button, Card, CardBody, Checkbox, Input } from '@nextui-org/react'

interface ChargingStationControlProps {
    filters: ChargingStationFilters
    onFiltersChange: (filters: Partial<ChargingStationFilters>) => void
    stationCount: number
    isVisible: boolean
    onToggle: () => void
}

const ChargingStationControl: React.FC<ChargingStationControlProps> = ({
    filters,
    onFiltersChange,
    stationCount,
    isVisible,
    onToggle
}) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className='absolute top-[170px] right-[34px] z-[1000] flex flex-col gap-1'>
            {/* Toggle Button */}
            <Button
                isIconOnly
                size='sm'
                variant={isVisible ? 'solid' : 'bordered'}
                color={isVisible ? 'primary' : 'default'}
                onPress={onToggle}
                className={`w-8 h-8 min-w-8 shadow-medium ${
                    isVisible
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-divider'
                }`}
                title='Toggle Charging Stations'
            >
                <MdEvStation size={16} />
            </Button>

            {/* Filter Button - only show when stations are visible */}
            {isVisible && (
                <Button
                    isIconOnly
                    size='sm'
                    variant={isExpanded ? 'solid' : 'bordered'}
                    color={isExpanded ? 'primary' : 'default'}
                    onPress={() => setIsExpanded(!isExpanded)}
                    className={`w-8 h-8 min-w-8 shadow-medium ${
                        isExpanded
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background border-divider'
                    }`}
                    title='Filter Charging Stations'
                >
                    <HiOutlineAdjustmentsHorizontal size={16} />
                </Button>
            )}

            {/* Expanded Filter Panel */}
            {isVisible && isExpanded && (
                <Card className='absolute top-0 right-[38px] w-80 shadow-large'>
                    <CardBody className='p-4 space-y-4'>
                        {/* Header */}
                        <div className='flex justify-between items-center'>
                            <h3 className='text-sm font-semibold text-foreground'>
                                Charging Stations (WIP)
                            </h3>
                            <span className='text-xs text-default-500'>
                                {stationCount} found
                            </span>
                        </div>

                        {/* Charger Type Filters */}
                        <div className='space-y-2 flex flex-col'>
                            <p className='text-xs font-medium text-default-700 uppercase tracking-wide'>
                                Charger Types
                            </p>

                            <Checkbox
                                isSelected={filters.showFastChargers}
                                onValueChange={(checked) => {
                                    onFiltersChange({
                                        showFastChargers: checked
                                    })
                                }}
                                size='sm'
                                color='primary'
                            >
                                <div className='flex items-center gap-2 text-sm'>
                                    <div className='w-2 h-2 rounded-full bg-red-500'></div>
                                    Fast Chargers (DC)
                                </div>
                            </Checkbox>

                            <Checkbox
                                isSelected={filters.showLevel2}
                                onValueChange={(checked) => {
                                    onFiltersChange({ showLevel2: checked })
                                }}
                                size='sm'
                                color='primary'
                            >
                                <div className='flex items-center gap-2 text-sm'>
                                    <div className='w-2 h-2 rounded-full bg-orange-500'></div>
                                    Level 2 (AC)
                                </div>
                            </Checkbox>

                            <Checkbox
                                isSelected={filters.showLevel1}
                                onValueChange={(checked) => {
                                    onFiltersChange({ showLevel1: checked })
                                }}
                                size='sm'
                                color='primary'
                            >
                                <div className='flex items-center gap-2 text-sm'>
                                    <div className='w-2 h-2 rounded-full bg-green-500'></div>
                                    Level 1 / Other
                                </div>
                            </Checkbox>
                        </div>

                        {/* Search Filter */}
                        <div className='space-y-2'>
                            <p className='text-xs font-medium text-default-700 uppercase tracking-wide'>
                                Search
                            </p>
                            <Input
                                size='sm'
                                placeholder='Station name or address...'
                                value={filters.searchTerm}
                                onValueChange={(value) =>
                                    onFiltersChange({ searchTerm: value })
                                }
                                variant='bordered'
                                classNames={{
                                    input: 'text-sm',
                                    inputWrapper: 'h-9'
                                }}
                            />
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    )
}

export default ChargingStationControl
