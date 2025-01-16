import React, { useState } from 'react'
import { Button, Input } from '@nextui-org/react'

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
    <div className='px-6 pt-0 pb-4 md:p-6 md:pb-0 bg-white flex flex-col gap-4 w-full select-an-ev'>
      <h2 className='text-lg font-bold text-center md:text-left hidden md:block'>
        Search for an EV
      </h2>
      <div className={`inline-flex items-center justify-evenly visible md:hidden ${!isMapVisible ? 'pt-4' : ''}`}>
        <h2 className='text-lg font-bold text-center md:text-left'>
          Search for an EV
        </h2>
        <Button onPress={handleToggleMap} color='primary' className='h-6'>
          {isMapVisible ? 'Hide Map' : 'Show Map'}
        </Button>
      </div>
      <Input
        placeholder='Search for a make or model...'
        value={searchQuery}
        onChange={handleInputChange}
      />
    </div>
  )
}

export default SearchInput
