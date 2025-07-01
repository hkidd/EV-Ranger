import React, { useState } from 'react'
import {
    Card,
    CardBody,
    Input,
    Button,
    Divider,
    Link,
    Chip
} from '@nextui-org/react'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { SiFacebook } from 'react-icons/si'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isFacebookLoading, setIsFacebookLoading] = useState(false)

    const { login, loginWithGoogle, loginWithFacebook } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/explore'

    const toggleVisibility = () => setIsVisible(!isVisible)

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await login(email, password)
            toast.success('Welcome back!')
            navigate(from, { replace: true })
        } catch (error: unknown) {
            console.error('Login error:', error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('Failed to sign in')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        try {
            await loginWithGoogle()
            toast.success('Welcome to EV Ranger!')
            navigate(from, { replace: true })
        } catch (error: unknown) {
            console.error('Google login error:', error)
            if (error instanceof Error) {
                toast.error(error.message || 'Failed to sign in with Google')
            } else {
                toast.error('Failed to sign in with Google')
            }
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleFacebookLogin = async () => {
        setIsFacebookLoading(true)
        try {
            await loginWithFacebook()
            toast.success('Welcome to EV Ranger!')
            navigate(from, { replace: true })
        } catch (error: unknown) {
            console.error('Facebook login error:', error)
            if (error instanceof Error) {
                toast.error(error.message || 'Failed to sign in with Facebook')
            } else {
                toast.error('Failed to sign in with Facebook')
            }
        } finally {
            setIsFacebookLoading(false)
        }
    }

    return (
        <div className='min-h-screen-minus-header bg-background dark:bg-background flex items-center justify-center p-6'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-foreground mb-2'>
                        Welcome Back
                    </h1>
                    <p className='text-foreground/60'>
                        Sign in to access your EV journey tools
                    </p>
                </div>

                <Card className='shadow-xl border border-divider/20'>
                    <CardBody className='p-8'>
                        {/* Social Login Buttons */}
                        <div className='space-y-3 mb-6'>
                            <Button
                                variant='bordered'
                                size='lg'
                                className='w-full border-divider hover:bg-content2/50'
                                startContent={<FcGoogle size={20} />}
                                onPress={handleGoogleLogin}
                                isLoading={isGoogleLoading}
                            >
                                Continue with Google
                            </Button>

                            <Button
                                variant='bordered'
                                size='lg'
                                className='w-full border-divider hover:bg-content2/50'
                                startContent={
                                    <SiFacebook
                                        size={20}
                                        className='text-blue-600'
                                    />
                                }
                                onPress={handleFacebookLogin}
                                isLoading={isFacebookLoading}
                            >
                                Continue with Facebook
                            </Button>
                        </div>

                        <div className='flex items-center my-6'>
                            <Divider className='flex-1' />
                            <span className='px-3 text-sm text-foreground/50'>
                                or
                            </span>
                            <Divider className='flex-1' />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className='space-y-4'>
                            <Input
                                type='email'
                                label='Email'
                                placeholder='your.email@example.com'
                                value={email}
                                onValueChange={setEmail}
                                startContent={
                                    <FiMail className='text-foreground/40' />
                                }
                                variant='bordered'
                                size='lg'
                                isRequired
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper:
                                        'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Input
                                label='Password'
                                placeholder='Enter your password'
                                value={password}
                                onValueChange={setPassword}
                                startContent={
                                    <FiLock className='text-foreground/40' />
                                }
                                endContent={
                                    <button
                                        className='focus:outline-none'
                                        type='button'
                                        onClick={toggleVisibility}
                                    >
                                        {isVisible ? (
                                            <FiEyeOff className='text-foreground/40 hover:text-foreground/60' />
                                        ) : (
                                            <FiEye className='text-foreground/40 hover:text-foreground/60' />
                                        )}
                                    </button>
                                }
                                type={isVisible ? 'text' : 'password'}
                                variant='bordered'
                                size='lg'
                                isRequired
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper:
                                        'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Button
                                type='submit'
                                color='primary'
                                size='lg'
                                className='w-full font-semibold'
                                isLoading={isLoading}
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className='mt-6 text-center'>
                            <p className='text-sm text-foreground/60'>
                                Don't have an account?{' '}
                                <Link
                                    href='/signup'
                                    className='text-primary hover:text-primary/80 font-medium'
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </CardBody>
                </Card>

                <div className='mt-6 text-center'>
                    <Chip
                        size='sm'
                        variant='flat'
                        className='bg-primary/10 text-primary'
                    >
                        🔒 Your data is secure and private
                    </Chip>
                </div>
            </div>
        </div>
    )
}
