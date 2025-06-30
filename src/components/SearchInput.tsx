import React, { useState } from 'react'
import { Button, Input, Chip } from '@nextui-org/react'
import { FiSearch, FiMap, FiEyeOff, FiZap } from 'react-icons/fi'

interface SearchInputProps {
    isMapVisible: boolean
    onFilter: (query: string) => void
    handleToggleMap: () => void
}

const SearchInput: React.FC<SearchInputProps> = ({
    handleToggleMap,
    onFilter,
    isMapVisible
}) => {
    const [searchQuery, setSearchQuery] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        onFilter(query)
    }

    return (
        <div className='px-6 pt-6 bg-gradient-to-b from-background/80 to-background backdrop-blur-sm'>
            {/* Header Section */}
            <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-xl bg-primary/10 flex items-center justify-center'>
                        <FiZap className='text-primary' size={20} />
                    </div>
                    <div>
                        <h2 className='text-xl font-bold text-foreground'>
                            Find Your EV
                        </h2>
                        <p className='text-sm text-foreground/60 hidden md:block'>
                            Discover electric vehicles and visualize their range
                        </p>
                    </div>
                </div>

                {/* Mobile Map Toggle */}
                <div className='md:hidden'>
                    <Button
                        onPress={handleToggleMap}
                        variant='flat'
                        color='primary'
                        size='sm'
                        startContent={
                            isMapVisible ? (
                                <FiEyeOff size={16} />
                            ) : (
                                <FiMap size={16} />
                            )
                        }
                        className='bg-primary/10 hover:bg-primary/20 transition-colors'
                    >
                        {isMapVisible ? 'Hide Map' : 'Show Map'}
                    </Button>
                </div>
            </div>

            {/* Search Input */}
            <div className='space-y-3'>
                <Input
                    placeholder='Search for make, model, or variant...'
                    value={searchQuery}
                    onChange={handleInputChange}
                    startContent={
                        <FiSearch className='text-foreground/40' size={18} />
                    }
                    size='lg'
                    classNames={{
                        base: 'w-full',
                        inputWrapper: [
                            'bg-content1/50 backdrop-blur-sm border-2',
                            'hover:border-primary/30 focus-within:border-primary/30',
                            'shadow-sm hover:shadow-md transition-all duration-200',
                            ''
                        ].join(' '),
                        input: [
                            'text-foreground placeholder:text-foreground/50',
                            'text-base font-medium'
                        ].join(' ')
                    }}
                    radius='lg'
                />

                {/* Search Suggestions/Chips */}
                {!searchQuery && (
                    <div className='flex flex-wrap gap-2'>
                        <Chip
                            size='sm'
                            variant='flat'
                            className='bg-primary/5 text-primary/80 hover:bg-primary/10 cursor-pointer transition-colors'
                            onClick={() => {
                                setSearchQuery('Tesla')
                                onFilter('Tesla')
                            }}
                        >
                            Tesla
                        </Chip>
                        <Chip
                            size='sm'
                            variant='flat'
                            className='bg-primary/5 text-primary/80 hover:bg-primary/10 cursor-pointer transition-colors'
                            onClick={() => {
                                setSearchQuery('Rivian')
                                onFilter('Rivian')
                            }}
                        >
                            Rivian
                        </Chip>
                        <Chip
                            size='sm'
                            variant='flat'
                            className='bg-primary/5 text-primary/80 hover:bg-primary/10 cursor-pointer transition-colors'
                            onClick={() => {
                                setSearchQuery('BMW')
                                onFilter('BMW')
                            }}
                        >
                            BMW
                        </Chip>
                        <Chip
                            size='sm'
                            variant='flat'
                            className='bg-primary/5 text-primary/80 hover:bg-primary/10 cursor-pointer transition-colors'
                            onClick={() => {
                                setSearchQuery('Mercedes')
                                onFilter('Mercedes')
                            }}
                        >
                            Mercedes
                        </Chip>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchInput
