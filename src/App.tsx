import type { NavigateOptions } from 'react-router-dom'
import { useNavigate, useHref, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './modules/Dashboard/Dashboard'
import NavBar from './modules/Navigation/NavBar'
import About from './modules/About/About'
import { NextUIProvider } from '@nextui-org/react'
import { useState } from 'react'
import AppTour from './AppTour'
import { TempProvider } from './context/TempProvider'
import { ThemeProvider } from './context/ThemeProvider'
import Footer from './components/Footer'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

// Declare the router config module
declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
})

function App() {
  const navigate = useNavigate()
  const [run, setRun] = useState(false)
  const [hasTourEnded, setHasTourEnded] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={navigate} useHref={useHref}>
        <ThemeProvider>
          <TempProvider>
            <AppTour run={run} onTourComplete={() => setHasTourEnded(true)} />
            <NavBar setRun={setRun} hideTourButton={hasTourEnded} />
            <Routes>
              <Route path='/' element={<Navigate to='/explore' replace />} />
              <Route path='/about' element={<About />} />
              <Route path='/explore' element={<Dashboard />} />
            </Routes>
            <Footer />
          </TempProvider>
        </ThemeProvider>
      </NextUIProvider>
    </QueryClientProvider>
  )
}

export default App
