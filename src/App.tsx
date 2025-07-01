import type { NavigateOptions } from 'react-router-dom'
import { useNavigate, useHref, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './modules/Dashboard/Dashboard'
import NavBar from './modules/Navigation/NavBar'
import About from './modules/About/About'
import Feedback from './modules/Feedback/Feedback'
import Login from './modules/Auth/Login'
import Signup from './modules/Auth/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { NextUIProvider } from '@nextui-org/react'
import { TempProvider } from './context/TempProvider'
import { ThemeProvider } from './context/ThemeProvider'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import 'react-toastify/dist/ReactToastify.css'

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

    return (
        <QueryClientProvider client={queryClient}>
            <NextUIProvider navigate={navigate} useHref={useHref}>
                <ThemeProvider>
                    <AuthProvider>
                        <TempProvider>
                            <NavBar />
                            <Routes>
                                <Route
                                    path='/'
                                    element={<Navigate to='/about' replace />}
                                />
                                <Route path='/about' element={<About />} />
                                <Route path='/login' element={<Login />} />
                                <Route path='/signup' element={<Signup />} />
                                <Route
                                    path='/explore'
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path='/feedback'
                                    element={
                                        <ProtectedRoute>
                                            <Feedback />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                            <Footer />
                            <ToastContainer
                                position='top-right'
                                autoClose={5000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme='colored'
                                toastClassName='!bg-background !text-primary !border !border-divider'
                                progressClassName='!bg-primary'
                            />
                        </TempProvider>
                    </AuthProvider>
                </ThemeProvider>
            </NextUIProvider>
        </QueryClientProvider>
    )
}

export default App
