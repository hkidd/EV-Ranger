import React from 'react'
import ColorTreeLogo from '../../assets/Logos/ColorTreeLogoNoBkg.webp'

const About: React.FC = () => {
  const title = 'About EV Ranger'
  const description =
    'EV Ranger is dedicated to providing comprehensive resources and tools for electric vehicle enthusiasts in the US. Our goal is to empower users with the knowledge and capabilities to make informed decisions about EVs, promote sustainable transportation, and support the growth of the electric vehicle community.'
  const highlights = [
    'Compare electric vehicles and find the best fit for your needs',
    'Learn about the latest EV technologies and trends (coming soon)',
    <>
      Map out your adventures (distance from a pin now, but more to come) and
      always{' '}
      <span className='font-bold italic text-primary'>
        Know How Far You&apos;ll Go
      </span>
    </>
  ]
  const imageAlt = 'EV Ranger Tree Logo'

  return (
    <section className='relative bg-white overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center'>
        <h1 className='text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary'>
          {title}
        </h1>
      </div>
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'>
        <div className='grid grid-cols-1 lg:grid-cols-2 items-center'>
          <div className='order-1 lg:order-none flex justify-center'>
            <div className='w-full max-w-[150px] sm:max-w-[200px] md:max-w-[300px]'>
              <img
                className='object-contain rounded-lg w-full h-auto'
                src={ColorTreeLogo}
                alt={imageAlt}
              />
            </div>
          </div>
          <div className='order-2 lg:order-none mt-8 lg:mt-0'>
            <h2 className='text-xl sm:text-2xl font-bold text-primary mb-4'>
              Who We Are
            </h2>
            <p className='text-gray-600 text-base leading-7 mb-6'>
              {description}
            </p>
            {highlights.length > 0 && (
              <ul className='space-y-4'>
                {highlights.map((highlight, index) => (
                  <li key={index} className='flex items-start'>
                    <span className='mr-2 inline-block h-2 w-2 rounded-full bg-primary mt-2 shrink-0'></span>
                    <span className='text-gray-700 text-sm sm:text-base'>
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
