import React from 'react'
import ColorTreeLogo from '../../assets/Logos/ColorTreeLogoNoBkg.webp'
import {
  HiOutlineMap,
  HiOutlineCalculator,
  HiOutlineGlobeAlt,
  HiOutlineChartBar
} from 'react-icons/hi'

const About: React.FC = () => {
  const features = [
    {
      title: 'Interactive Range Mapping',
      description:
        'Plan your journeys with confidence using our interactive range visualization tool. See exactly how far your EV can go.',
      icon: <HiOutlineMap className='w-6 h-6' />,
      color: 'text-blue-500'
    },
    {
      title: 'Smart Range Calculator',
      description:
        'Get precise range estimates that account for real-world conditions like temperature, terrain, and driving style.',
      icon: <HiOutlineCalculator className='w-6 h-6' />,
      color: 'text-green-500'
    },
    {
      title: 'Comprehensive EV Database',
      description:
        'Explore detailed information about current and upcoming electric vehicles, from specs to real-world performance.',
      icon: <HiOutlineGlobeAlt className='w-6 h-6' />,
      color: 'text-purple-500'
    },
    {
      title: 'Performance Analytics',
      description:
        'Compare EVs side by side with detailed metrics, efficiency ratings, and real-world range data.',
      icon: <HiOutlineChartBar className='w-6 h-6' />,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className='min-h-screen-minus-header bg-background dark:bg-background'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70 dark:from-primary/80 dark:via-primary/70 dark:to-primary/60'>
        <div className='relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32'>
          <main className='mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28'>
            <div className='text-center'>
              <h1 className='text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl'>
                <span className='block'>Know How Far</span>
                <span className='block text-white/90'>You'll Go</span>
              </h1>
              <p className='mt-3 text-base text-white/80 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl'>
                Make confident decisions about electric vehicles with our
                comprehensive range visualization and comparison tools.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <div className='py-16 bg-content1 dark:bg-content1'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='lg:text-center'>
            <h2 className='text-base text-primary font-semibold tracking-wide uppercase'>
              Features
            </h2>
            <p className='mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground dark:text-foreground sm:text-4xl'>
              Everything you need to explore EVs
            </p>
            <p className='mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto'>
              Our suite of tools helps you understand and compare electric
              vehicles like never before.
            </p>
          </div>

          <div className='mt-12'>
            <div className='space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12'>
              {features.map((feature, index) => (
                <div key={index} className='relative group'>
                  <div className='absolute flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20'>
                    {feature.icon}
                  </div>
                  <div className='ml-16'>
                    <h3 className='text-lg leading-6 font-semibold text-foreground dark:text-foreground'>
                      {feature.title}
                    </h3>
                    <p className='mt-2 text-base text-gray-500 dark:text-gray-400 leading-relaxed'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className='relative py-20 bg-background dark:bg-background overflow-hidden'>
        <div className='relative px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h2 className='text-3xl leading-8 font-extrabold tracking-tight text-foreground dark:text-foreground sm:text-4xl'>
              Our Mission
            </h2>
            <div className='mt-8 space-y-6 text-xl text-gray-500 dark:text-gray-400'>
              <p className='leading-relaxed'>
                EV Ranger is dedicated to providing comprehensive resources and
                tools for electric vehicle enthusiasts in the US. Our goal is to
                empower users with the knowledge and capabilities to make
                informed decisions about EVs, promote sustainable
                transportation, and support the growth of the electric vehicle
                community.
              </p>
              <p className='leading-relaxed'>
                We believe that making the switch to electric vehicles should be
                an informed and confident decision. That's why we've created a
                platform that combines powerful visualization tools with
                comprehensive vehicle data to help you understand exactly what
                each EV can do for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className='bg-content1 dark:bg-content1'>
        <div className='max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-center'>
            <div className='w-48 h-48 transform transition-transform hover:scale-105'>
              <img
                className='object-contain w-full h-full'
                src={ColorTreeLogo}
                alt='EV Ranger Tree Logo'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
