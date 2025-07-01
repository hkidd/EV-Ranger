import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, CardBody, Spinner } from '@nextui-org/react'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className='min-h-screen-minus-header bg-background dark:bg-background flex items-center justify-center'>
                <Card className='p-8'>
                    <CardBody className='flex flex-col items-center space-y-4'>
                        <Spinner size='lg' color='primary' />
                        <p className='text-foreground/60'>Loading...</p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to='/signup' state={{ from: location }} replace />
    }

    // Render protected content if authenticated
    return <>{children}</>
}
