import type { NavigateOptions } from 'react-router-dom'
import { useNavigate, useHref, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './modules/Dashboard/Dashboard'
import NavBar from './modules/Navigation/NavBar'
import About from './modules/About/About'
import { NextUIProvider } from '@nextui-org/react'
import {useState} from 'react'
import AppTour from './AppTour'
import { TempProvider } from './context/TempContext'
import Footer from './components/Footer'

// Declare the router config module
declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

// Initialize QueryClient
const queryClient = new QueryClient()

function App() {
  const navigate = useNavigate()
  const [run, setRun] = useState(false)
  const [hasTourEnded, setHasTourEnded] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={navigate} useHref={useHref}>
        <AppTour run={run} onTourComplete={() => setHasTourEnded(true)} />
        <NavBar setRun={setRun} hideTourButton={hasTourEnded} />
        <TempProvider>
          <Routes>
            <Route path='/' element={<Navigate to='/explore' replace />} />
            <Route path='/about' element={<About />} />
            <Route path='/explore' element={<Dashboard />} />
          </Routes>
        </TempProvider>
        <Footer />
      </NextUIProvider>
    </QueryClientProvider>
  )
}

export default App
