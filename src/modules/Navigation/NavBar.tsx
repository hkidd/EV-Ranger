import React, { useState } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle
} from '@nextui-org/react'
import EVRangerBanner from '../../assets/Logos/BannerNoBkg.svg'

interface NavBarProps {
  setRun: React.Dispatch<React.SetStateAction<boolean>>
  hideTourButton: boolean
}

export default function NavBar({ setRun, hideTourButton }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Navbar
      isBordered
      maxWidth='full'
      className='flex flex-col px-0 py-2 md:py-0'
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={(open) => setIsMenuOpen(open)}
    >
      <div className='flex justify-between items-center w-full'>
        <NavbarBrand className='flex items-center'>
          <img
            src={EVRangerBanner}
            alt='EV Ranger Logo'
            className='w-60 h-auto'
          />
          {!hideTourButton && (
            <button
              onClick={() => setRun(true)}
              className='px-2 py-1 bg-[#4ECCA3] text-white text-xs rounded ml-4 hidden md:inline-block'
            >
              Tour Guide
            </button>
          )}
        </NavbarBrand>

        <div className='flex md:hidden'>
          <NavbarMenuToggle aria-label='toggle menu' />
        </div>
      </div>

      {/* Desktop nav items */}
      <NavbarContent className='hidden md:flex gap-4 w-full md:justify-center mt-4'>
        <NavbarItem isActive={window.location.pathname === '/about'}>
          <Link
            color={
              window.location.pathname === '/about' ? 'primary' : 'secondary'
            }
            href='/about'
          >
            About
          </Link>
        </NavbarItem>

        <NavbarItem isActive={window.location.pathname === '/explore'}>
          <Link
            color={
              window.location.pathname === '/explore' ? 'primary' : 'secondary'
            }
            href='/explore'
          >
            Explore
          </Link>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu className='md:hidden mt-2'>
        <NavbarMenuItem>
          <Link
            color='foreground'
            href='/about'
            onPress={() => setIsMenuOpen(false)}
          >
            About
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            color='foreground'
            href='/explore'
            onPress={() => setIsMenuOpen(false)}
          >
            Explore
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  )
}
