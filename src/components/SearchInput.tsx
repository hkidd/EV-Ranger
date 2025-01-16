import React, { useState } from 'react'
import { Input } from '@nextui-org/react'

interface SearchInputProps {
  onFilter: (query: string) => void
}

const SearchInput: React.FC<SearchInputProps> = ({ onFilter }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onFilter(query)
  }

  return (
    <div className='px-6 pt-0 pb-6 md:p-6 bg-white flex flex-col gap-4 w-full select-an-ev'>
      <h2 className='text-lg font-bold text-center md:text-left'>
        Search for an EV
      </h2>
      <Input
        placeholder='Search for a make or model...'
        value={searchQuery}
        onChange={handleInputChange}
      />
    </div>
  )
}

export default SearchInput
