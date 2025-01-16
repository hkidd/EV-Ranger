import React from 'react'
import Skeleton from './Skeleton'

const CarListSkeleton: React.FC = () => {
  return (
    <ul className='space-y-4'>
      {[1, 2, 3, 4, 5].map((item) => (
        <li key={item} className='flex items-center space-x-4'>
          <Skeleton className='h-10 w-10 rounded-full' />{' '}
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4 rounded' />
            <Skeleton className='h-3 w-1/2 rounded' />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default CarListSkeleton
