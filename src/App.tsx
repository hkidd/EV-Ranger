import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from './context/ThemeProvider'

const About = lazy(() => import('./modules/About/About'))
const BuyerWorkspace = lazy(() => import('./modules/Buyer/BuyerWorkspace'))
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
})
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Suspense
          fallback={<div className="app-loading">Loading EV Ranger…</div>}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/compare" replace />} />
            <Route path="/compare" element={<BuyerWorkspace />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/compare" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
