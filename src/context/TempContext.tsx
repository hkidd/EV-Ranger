import React, { createContext, useState, ReactNode } from 'react'

interface TempContextType {
  externalTemp: number
  setExternalTemp: (temp: number) => void
}

export const TempContext = createContext<TempContextType | undefined>(undefined)

interface TempProviderProps {
  children: ReactNode
}

export const TempProvider: React.FC<TempProviderProps> = ({ children }) => {
  // Set the default external temperature to 70°F
  const [externalTemp, setExternalTemp] = useState<number>(70)

  return (
    <TempContext.Provider value={{ externalTemp, setExternalTemp }}>
      {children}
    </TempContext.Provider>
  )
}
