import React, { useState, useCallback, ReactNode } from 'react'
import { TempContext, TempContextType } from './TempContext'

type TemperatureUnit = 'F' | 'C'

export const TempProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [externalTemp, setExternalTemp] = useState<number>(70)
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('F')

  // Function to toggle between F and C
  const toggleTempUnit = useCallback(() => {
    setTempUnit((prevUnit) => {
      const newUnit = prevUnit === 'F' ? 'C' : 'F'
      // Convert the current temperature to the new unit
      if (newUnit === 'C') {
        setExternalTemp(Math.round(((externalTemp - 32) * 5) / 9))
      } else {
        setExternalTemp(Math.round((externalTemp * 9) / 5 + 32))
      }
      return newUnit
    })
  }, [externalTemp])

  // Convert a temperature to the current display unit
  const getTempInUnit = useCallback(
    (temp: number): number => {
      if (tempUnit === 'C' && temp > -17.8 && temp < 48.9) {
        // Convert from F to C
        return Math.round(((temp - 32) * 5) / 9)
      } else if (tempUnit === 'F' && temp > -20 && temp < 120) {
        // Convert from C to F
        return Math.round((temp * 9) / 5 + 32)
      }
      return temp
    },
    [tempUnit]
  )

  // Get temperature with unit for display
  const getDisplayTemp = useCallback((): string => {
    return `${externalTemp}°${tempUnit}`
  }, [externalTemp, tempUnit])

  // Calculate the temperature modifier for range calculations
  const calculateTempModifier = useCallback(
    (temp: number): number => {
      // Ensure we're working with Fahrenheit for the calculation
      const tempInF = tempUnit === 'C' ? (temp * 9) / 5 + 32 : temp

      // Optimal temperature range is 70-75°F
      if (tempInF >= 70 && tempInF <= 75) {
        return 1.0 // No adjustment needed
      }

      // Cold weather penalty (below 70°F)
      if (tempInF < 70) {
        // Linear reduction down to 50% efficiency at -20°F
        const coldRange = 70 - -20
        const tempFromOptimal = 70 - tempInF
        return 1.0 - 0.5 * (tempFromOptimal / coldRange)
      }

      // Hot weather penalty (above 75°F)
      // Linear reduction down to 85% efficiency at 120°F
      const hotRange = 120 - 75
      const tempFromOptimal = tempInF - 75
      return 1.0 - 0.15 * (tempFromOptimal / hotRange)
    },
    [tempUnit]
  )

  const contextValue: TempContextType = {
    externalTemp,
    setExternalTemp,
    tempUnit,
    toggleTempUnit,
    getTempInUnit,
    getDisplayTemp,
    calculateTempModifier
  }

  return (
    <TempContext.Provider value={contextValue}>{children}</TempContext.Provider>
  )
}
