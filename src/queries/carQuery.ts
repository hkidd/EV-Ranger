import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useQuery } from '@tanstack/react-query'
import { CarVariant } from '../types'

interface Car {
  id: string
  brand: string
  model: string
  variants: CarVariant[]
}

const fetchCars = async (): Promise<Car[]> => {
  const querySnapshot = await getDocs(collection(db, 'vehicles'))
  const cars: Car[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Car[]

  // Sort cars by brand and then by model
  cars.sort((a, b) => {
    const brandA = a.brand.toLowerCase()
    const brandB = b.brand.toLowerCase()
    if (brandA < brandB) return -1
    if (brandA > brandB) return 1

    const modelA = a.model.toLowerCase()
    const modelB = b.model.toLowerCase()
    if (modelA < modelB) return -1
    if (modelA > modelB) return 1

    return 0
  })

  return cars
}

export const useCarsQuery = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchCars,
    staleTime: 3600000
  }) // 1 hour stale time
}
