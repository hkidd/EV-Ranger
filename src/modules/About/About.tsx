import React from 'react'
import ColorTreeLogo from '../../assets/Logos/ColorTreeLogoNoBkg.webp'
import ExampleImageLight from '../../assets/Examples/EVRangerEx725Light.png'
import ExampleImageDark from '../../assets/Examples/EVRangerEx725Dark.png'
import {
    HiOutlineMap,
    HiOutlineCalculator,
    HiOutlineGlobeAlt,
    HiOutlineShieldCheck,
    HiOutlineLightningBolt,
    HiOutlineCog
} from 'react-icons/hi'
import { Card, CardBody, Chip } from '@nextui-org/react'
import { useTheme } from '../../context/ThemeContext'

const About: React.FC = () => {
    const { isDarkMode } = useTheme()
    
    const coreFeatures = [
        {
            title: 'Interactive Range Visualization',
            description:
                'Clean, intuitive mapping interface that helps you understand exactly how far your EV can travel from any starting point.',
            icon: <HiOutlineMap className='w-6 h-6' />
        },
        {
            title: 'Comprehensive EV Database',
            description:
                'Carefully curated information about popular electric vehicles, including real-world range data and charging specifications.',
            icon: <HiOutlineGlobeAlt className='w-6 h-6' />
        },
        {
            title: 'Modern Web Architecture',
            description:
                'Built with React, TypeScript, and modern development practices to ensure a fast, reliable, and maintainable application.',
            icon: <HiOutlineShieldCheck className='w-6 h-6' />
        },
        {
            title: 'Smart Range Calculations',
            description:
                'Thoughtfully designed algorithms that consider key factors affecting EV range to provide useful estimates for trip planning.',
            icon: <HiOutlineCalculator className='w-6 h-6' />
        }
    ]

    const techSpecs = [
        { label: 'EV Models', value: '50+' },
        { label: 'Range Algorithm', value: 'Advanced' },
        { label: 'Map Integration', value: 'Real-time' },
        { label: 'User Experience', value: 'Intuitive' }
    ]

    return (
        <div className='min-h-screen-minus-header bg-background dark:bg-background'>
            {/* Product Showcase */}
            <div className='py-20 bg-content1/30 dark:bg-content1/10'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='text-center mb-16'>
                        <div className='mb-8'>
                            <Chip
                                size='lg'
                                variant='flat'
                                className='bg-primary text-white font-medium border-0'
                            >
                                Smart EV Range Planning
                            </Chip>
                        </div>
                        <h3 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
                            Interactive Range
                            <span className='block text-primary'>
                                Visualization
                            </span>
                        </h3>
                        <p className='text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed'>
                            Select any electric vehicle and instantly see its
                            range coverage on an interactive map. Perfect for
                            trip planning and understanding EV capabilities.
                        </p>
                    </div>

                    <div className='relative'>
                        {/* Background decoration */}
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl blur-3xl'></div>

                        {/* Main image container */}
                        <div className='relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 md:p-8 border border-divider/20'>
                            <img
                                src={isDarkMode ? ExampleImageDark : ExampleImageLight}
                                alt='EV Ranger Interface - Interactive range visualization showing electric vehicle range overlay on map'
                                className='w-full h-auto rounded-xl shadow-lg'
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics - Cleaner */}
            <div className='py-12'>
                <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
                        {techSpecs.map((spec, index) => (
                            <div key={index} className='text-center'>
                                <div className='text-3xl font-bold text-primary mb-2'>
                                    {spec.value}
                                </div>
                                <div className='text-sm font-medium text-foreground/50 uppercase tracking-wider'>
                                    {spec.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Core Features - Minimalist Cards */}
            <div className='py-16'>
                <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='text-center mb-20'>
                        <h2 className='text-sm font-semibold text-primary uppercase tracking-wider mb-4'>
                            Core Features
                        </h2>
                        <h3 className='text-4xl md:text-5xl font-bold text-foreground mb-6'>
                            Built with Care,
                            <span className='block text-primary'>
                                Designed for You
                            </span>
                        </h3>
                        <p className='text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed'>
                            Every feature is carefully crafted to provide a
                            smooth, reliable experience that helps you make
                            confident decisions about electric vehicles.
                        </p>
                    </div>

                    <div className='grid md:grid-cols-2 gap-8'>
                        {coreFeatures.map((feature, index) => (
                            <Card
                                key={index}
                                className='group hover:shadow-lg transition-all duration-300 bg-content1/50 dark:bg-content1/20 border-0'
                            >
                                <CardBody className='p-8'>
                                    <div className='flex items-center mb-6'>
                                        <div className='p-3 rounded-xl bg-primary text-white mr-4 group-hover:bg-primary/90 transition-colors'>
                                            {feature.icon}
                                        </div>
                                        <h4 className='text-xl font-semibold text-foreground'>
                                            {feature.title}
                                        </h4>
                                    </div>
                                    <p className='text-foreground/70 leading-relaxed'>
                                        {feature.description}
                                    </p>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Values Section - Simplified */}
            <div className='py-16 bg-content1/30 dark:bg-content1/10'>
                <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='text-center mb-16'>
                        <h2 className='text-sm font-semibold text-primary uppercase tracking-wider mb-4'>
                            Our Approach
                        </h2>
                        <h3 className='text-4xl md:text-5xl font-bold text-foreground mb-8'>
                            Accelerating the Future of
                            <span className='block text-primary'>
                                Sustainable Mobility
                            </span>
                        </h3>
                    </div>

                    <div className='grid md:grid-cols-2 gap-12'>
                        <div className='text-center'>
                            <div className='p-4 rounded-full bg-primary inline-flex mb-6'>
                                <HiOutlineLightningBolt className='w-8 h-8 text-white' />
                            </div>
                            <h4 className='text-xl font-semibold text-foreground mb-4'>
                                User-Focused Design
                            </h4>
                            <p className='text-foreground/70 leading-relaxed'>
                                Every feature is designed with the end user in
                                mind, prioritizing clarity, ease of use, and
                                practical value for EV owners.
                            </p>
                        </div>

                        <div className='text-center'>
                            <div className='p-4 rounded-full bg-primary inline-flex mb-6'>
                                <HiOutlineShieldCheck className='w-8 h-8 text-white' />
                            </div>
                            <h4 className='text-xl font-semibold text-foreground mb-4'>
                                Accurate & Reliable
                            </h4>
                            <p className='text-foreground/70 leading-relaxed'>
                                We strive for accuracy in our range calculations
                                and data presentation, using established
                                methodologies and reliable sources.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Technology Section - Clean */}
            <div className='py-16'>
                <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
                    <div className='mb-16'>
                        <div className='p-6 rounded-full bg-primary inline-flex mb-8'>
                            <HiOutlineCog className='w-12 h-12 text-white' />
                        </div>
                        <h3 className='text-3xl font-bold text-foreground mb-6'>
                            Quality Development
                        </h3>
                        <p className='text-lg text-foreground/70 leading-relaxed mb-8 max-w-2xl mx-auto'>
                            EV Ranger is built with modern development
                            practices, clean code principles, and a focus on
                            user experience to deliver a reliable and enjoyable
                            application.
                        </p>
                        <div className='flex justify-center space-x-4'>
                            <Chip
                                size='md'
                                variant='flat'
                                className='bg-primary text-white border-0'
                            >
                                React
                            </Chip>
                            <Chip
                                size='md'
                                variant='flat'
                                className='bg-primary/20 text-primary border-0'
                            >
                                TypeScript
                            </Chip>
                            <Chip
                                size='md'
                                variant='flat'
                                className='bg-primary text-white border-0'
                            >
                                Modern UI
                            </Chip>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand Section - Minimal */}
            <div className='py-16 bg-content1/30 dark:bg-content1/10'>
                <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='text-center'>
                        <div className='w-48 h-48 mx-auto mb-8'>
                            <img
                                className='object-contain w-full h-full'
                                src={ColorTreeLogo}
                                alt='EV Ranger - Powering the Future of Electric Mobility'
                            />
                        </div>
                        <h3 className='text-2xl font-bold text-foreground mb-4'>
                            EV Ranger
                        </h3>
                        <p className='text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed'>
                            Where thoughtful design meets sustainable
                            transportation. Empowering electric vehicle adoption
                            through clear, reliable tools and information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default About
