import React, { useState } from 'react'
import {
    Card,
    CardBody,
    Input,
    Textarea,
    Button,
    Select,
    SelectItem,
    Chip
} from '@nextui-org/react'
import { FiMail, FiMessageSquare, FiSend, FiCheckCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { ChipColorTypes } from '../../types'

const feedbackTypes = [
    { key: 'bug', label: 'Bug Report', color: 'danger' },
    { key: 'feature', label: 'Feature Request', color: 'primary' },
    { key: 'improvement', label: 'Improvement', color: 'warning' },
    { key: 'general', label: 'General Feedback', color: 'success' }
]

export default function Feedback() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        type: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Send feedback via API
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/email/feedback`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }
            )

            const result = await response.json()

            if (response.ok && result.success) {
                // Show success toast
                toast.success(
                    '🎉 Thank you! Your feedback has been sent successfully.',
                    {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                    }
                )

                // Show success state
                setIsSubmitted(true)

                // Reset form after a delay
                setTimeout(() => {
                    setFormData({
                        name: '',
                        email: '',
                        type: '',
                        subject: '',
                        message: ''
                    })
                    setIsSubmitted(false)
                }, 3000)
            } else {
                throw new Error(result.error || 'Failed to send feedback')
            }
        } catch (error) {
            console.error('Error submitting feedback:', error)

            // Show error toast
            toast.error(
                '❌ Failed to send feedback. Please try again or contact us directly.',
                {
                    position: 'top-right',
                    autoClose: 7000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const isFormValid =
        formData.name &&
        formData.email &&
        formData.type &&
        formData.subject &&
        formData.message

    if (isSubmitted) {
        return (
            <div className='h-screen-minus-header bg-gradient-to-br from-primary/5 to-secondary/5 p-6 flex items-center justify-center'>
                <Card className='w-full max-w-md shadow-xl'>
                    <CardBody className='text-center py-12'>
                        <div className='flex justify-center mb-6'>
                            <div className='p-4 rounded-full bg-success/10'>
                                <FiCheckCircle
                                    size={48}
                                    className='text-success'
                                />
                            </div>
                        </div>
                        <h2 className='text-2xl font-bold text-foreground mb-4'>
                            Thank You!
                        </h2>
                        <p className='text-foreground/70 leading-relaxed'>
                            Your feedback has been sent successfully to our
                            team. We appreciate you taking the time to help
                            improve EV Ranger and will review your message
                            shortly.
                        </p>
                    </CardBody>
                </Card>
            </div>
        )
    }

    return (
        <div className='h-screen-minus-header bg-background dark:bg-background p-6'>
            <div className='max-w-4xl mx-auto'>
                {/* Header Section */}
                <div className='text-center mb-6'>
                    <div className='flex justify-center mb-6'>
                        <div className='p-4 rounded-full bg-primary/10'>
                            <FiMessageSquare
                                size={48}
                                className='text-primary'
                            />
                        </div>
                    </div>
                    <h1 className='text-4xl font-bold text-foreground mb-4'>
                        We'd Love Your Feedback
                    </h1>
                    <p className='text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed'>
                        Help us make EV Ranger better. Share your thoughts,
                        report bugs, or suggest new features.
                    </p>
                </div>

                {/* Feedback Form */}
                <Card className='shadow-xl'>
                    <CardBody className='p-6'>
                        <form onSubmit={handleSubmit} className='space-y-6'>
                            {/* Personal Information */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <Input
                                    label='Your Name'
                                    placeholder='Enter your name'
                                    value={formData.name}
                                    onValueChange={(value) =>
                                        handleInputChange('name', value)
                                    }
                                    variant='bordered'
                                    size='lg'
                                    classNames={{
                                        label: 'text-foreground/80 font-medium',
                                        input: 'text-foreground',
                                        inputWrapper:
                                            'border-divider hover:border-primary/50 focus-within:border-primary'
                                    }}
                                />

                                <Input
                                    label='Email Address'
                                    placeholder='your.email@example.com'
                                    type='email'
                                    value={formData.email}
                                    onValueChange={(value) =>
                                        handleInputChange('email', value)
                                    }
                                    variant='bordered'
                                    size='lg'
                                    startContent={
                                        <FiMail className='text-foreground/40' />
                                    }
                                    classNames={{
                                        label: 'text-foreground/80 font-medium',
                                        input: 'text-foreground',
                                        inputWrapper:
                                            'border-divider hover:border-primary/50 focus-within:border-primary'
                                    }}
                                />
                            </div>

                            {/* Feedback Type */}
                            <div>
                                <Select
                                    label='Feedback Type'
                                    placeholder='Select the type of feedback'
                                    selectedKeys={
                                        formData.type
                                            ? new Set([formData.type])
                                            : new Set()
                                    }
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(
                                            keys
                                        )[0] as string
                                        handleInputChange('type', selectedKey)
                                    }}
                                    variant='bordered'
                                    size='lg'
                                    classNames={{
                                        label: 'text-foreground/80 font-medium',
                                        trigger:
                                            'border-divider hover:border-primary/50 data-[focus=true]:border-primary',
                                        value: 'text-foreground'
                                    }}
                                    // --- Add renderValue prop here ---
                                    renderValue={(items) => {
                                        // 'items' will be an array of the selected SelectItem components
                                        const selectedType = feedbackTypes.find(
                                            (type) =>
                                                type.key ===
                                                Array.from(items)[0]?.key
                                        )

                                        return selectedType ? (
                                            <Chip
                                                size='sm'
                                                color={
                                                    selectedType.color as ChipColorTypes
                                                }
                                                variant='flat'
                                                className='capitalize'
                                            >
                                                {selectedType.label}
                                            </Chip>
                                        ) : (
                                            <span>
                                                {/* Fallback or empty if nothing is selected */}
                                            </span>
                                        )
                                    }}
                                >
                                    {feedbackTypes.map((type) => (
                                        <SelectItem
                                            key={type.key}
                                            textValue={type.label}
                                        >
                                            <div className='flex items-center gap-2'>
                                                <Chip
                                                    size='sm'
                                                    color={
                                                        type.color as ChipColorTypes
                                                    }
                                                    variant='flat'
                                                    className='capitalize'
                                                >
                                                    {type.label}
                                                </Chip>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Subject */}
                            <Input
                                label='Subject'
                                placeholder='Brief description of your feedback'
                                value={formData.subject}
                                onValueChange={(value) =>
                                    handleInputChange('subject', value)
                                }
                                variant='bordered'
                                size='lg'
                                classNames={{
                                    label: 'text-foreground/80 font-medium',
                                    input: 'text-foreground',
                                    inputWrapper:
                                        'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            {/* Message */}
                            <Textarea
                                label='Your Message'
                                placeholder='Please provide detailed feedback. The more specific you are, the better we can help!'
                                value={formData.message}
                                onValueChange={(value) =>
                                    handleInputChange('message', value)
                                }
                                variant='bordered'
                                minRows={6}
                                maxRows={10}
                                classNames={{
                                    label: 'text-foreground/80 font-medium',
                                    input: 'text-foreground',
                                    inputWrapper:
                                        'border-divider hover:border-primary/50 focus-within:border-primary'
                                }}
                            />

                            {/* Submit Button */}
                            <div className='flex justify-end'>
                                <Button
                                    type='submit'
                                    color='primary'
                                    size='lg'
                                    isDisabled={!isFormValid}
                                    isLoading={isSubmitting}
                                    startContent={!isSubmitting && <FiSend />}
                                    className='px-8 font-semibold'
                                >
                                    {isSubmitting
                                        ? 'Sending Feedback...'
                                        : 'Send Feedback'}
                                </Button>
                            </div>
                        </form>

                        {/* Contact Info */}
                        <div className='mt-6 pt-6 border-t border-divider'>
                            <div className='text-center text-foreground/60'>
                                <p className='text-sm'>
                                    You can also reach us directly at{' '}
                                    <a
                                        href='mailto:customerservice@evranger.io'
                                        className='text-primary hover:text-primary/80 font-medium transition-colors'
                                    >
                                        customerservice@evranger.io
                                    </a>
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}
