import React, { createContext } from 'react'

type TemperatureUnit = 'F' | 'C'

export interface TempContextType {
  externalTemp: number
  setExternalTemp: (temp: number) => void
  tempUnit: TemperatureUnit
  toggleTempUnit: () => void
  getTempInUnit: (temp: number) => number
  getDisplayTemp: () => string
  calculateTempModifier: (temp: number) => number
}

export const TempContext = createContext<TempContextType | null>(null)

// Custom hook for using the temperature context
export const useTemp = () => {
  const context = React.useContext(TempContext)
  if (!context) {
    throw new Error('useTemp must be used within a TempProvider')
  }
  return context
}
