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
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { SiFacebook } from 'react-icons/si'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isFacebookLoading, setIsFacebookLoading] = useState(false)
    
    const { signup, loginWithGoogle, loginWithFacebook } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    
    const from = location.state?.from?.pathname || '/explore'

    const toggleVisibility = () => setIsVisible(!isVisible)
    const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible)

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            await signup(email, password, displayName)
            toast.success('Welcome to EV Ranger!')
            navigate(from, { replace: true })
        } catch (error: any) {
            console.error('Signup error:', error)
            toast.error(error.message || 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setIsGoogleLoading(true)
        try {
            await loginWithGoogle()
            toast.success('Welcome to EV Ranger!')
            navigate(from, { replace: true })
        } catch (error: any) {
            console.error('Google signup error:', error)
            toast.error(error.message || 'Failed to sign up with Google')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleFacebookSignup = async () => {
        setIsFacebookLoading(true)
        try {
            await loginWithFacebook()
            toast.success('Welcome to EV Ranger!')
            navigate(from, { replace: true })
        } catch (error: any) {
            console.error('Facebook signup error:', error)
            toast.error(error.message || 'Failed to sign up with Facebook')
        } finally {
            setIsFacebookLoading(false)
        }
    }

    return (
        <div className='min-h-screen-minus-header bg-background dark:bg-background flex items-center justify-center p-6'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-foreground mb-2'>
                        Join EV Ranger
                    </h1>
                    <p className='text-foreground/60'>
                        Start your electric vehicle journey today
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
                                onPress={handleGoogleSignup}
                                isLoading={isGoogleLoading}
                            >
                                Continue with Google
                            </Button>
                            
                            <Button
                                variant='bordered'
                                size='lg'
                                className='w-full border-divider hover:bg-content2/50'
                                startContent={<SiFacebook size={20} className='text-blue-600' />}
                                onPress={handleFacebookSignup}
                                isLoading={isFacebookLoading}
                            >
                                Continue with Facebook
                            </Button>
                        </div>

                        <div className='flex items-center my-6'>
                            <Divider className='flex-1' />
                            <span className='px-3 text-sm text-foreground/50'>or</span>
                            <Divider className='flex-1' />
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailSignup} className='space-y-4'>
                            <Input
                                type='text'
                                label='Full Name'
                                placeholder='Enter your full name'
                                value={displayName}
                                onValueChange={setDisplayName}
                                startContent={<FiUser className='text-foreground/40' />}
                                variant='bordered'
                                size='lg'
                                isRequired
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper: 'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Input
                                type='email'
                                label='Email'
                                placeholder='your.email@example.com'
                                value={email}
                                onValueChange={setEmail}
                                startContent={<FiMail className='text-foreground/40' />}
                                variant='bordered'
                                size='lg'
                                isRequired
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper: 'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Input
                                label='Password'
                                placeholder='Create a password (min. 6 characters)'
                                value={password}
                                onValueChange={setPassword}
                                startContent={<FiLock className='text-foreground/40' />}
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
                                minLength={6}
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper: 'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Input
                                label='Confirm Password'
                                placeholder='Confirm your password'
                                value={confirmPassword}
                                onValueChange={setConfirmPassword}
                                startContent={<FiLock className='text-foreground/40' />}
                                endContent={
                                    <button
                                        className='focus:outline-none'
                                        type='button'
                                        onClick={toggleConfirmVisibility}
                                    >
                                        {isConfirmVisible ? (
                                            <FiEyeOff className='text-foreground/40 hover:text-foreground/60' />
                                        ) : (
                                            <FiEye className='text-foreground/40 hover:text-foreground/60' />
                                        )}
                                    </button>
                                }
                                type={isConfirmVisible ? 'text' : 'password'}
                                variant='bordered'
                                size='lg'
                                isRequired
                                classNames={{
                                    label: 'text-foreground/80',
                                    input: 'text-foreground',
                                    inputWrapper: 'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            <Button
                                type='submit'
                                color='primary'
                                size='lg'
                                className='w-full font-semibold'
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>
                        </form>

                        <div className='mt-6 text-center'>
                            <p className='text-sm text-foreground/60'>
                                Already have an account?{' '}
                                <Link 
                                    href='/login' 
                                    className='text-primary hover:text-primary/80 font-medium'
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </CardBody>
                </Card>

                <div className='mt-6 text-center'>
                    <Chip size='sm' variant='flat' className='bg-primary/10 text-primary'>
                        🔒 Your data is secure and private
                    </Chip>
                </div>
            </div>
        </div>
    )
}