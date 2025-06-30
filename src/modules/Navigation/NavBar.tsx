import { useState } from 'react'
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    NavbarMenu,
    NavbarMenuItem,
    Switch,
    Chip
} from '@nextui-org/react'
import EVRangerBanner from '../../assets/Logos/BannerNoBkg.svg'
import { useTheme } from '../../context/ThemeContext'
import { SunIcon, MoonIcon } from './ThemeIcons'
import { FiInfo, FiZap } from 'react-icons/fi'

// interface NavBarProps {
//     setRun: React.Dispatch<React.SetStateAction<boolean>>
//     hideTourButton: boolean
// }

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { isDarkMode, toggleTheme } = useTheme()

    return (
        <Navbar
            maxWidth='full'
            className='bg-background/80 backdrop-blur-lg border-b border-primary/50'
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={(open) => setIsMenuOpen(open)}
            height='auto'
        >
            <div className='flex justify-between items-center w-full py-2'>
                {/* Brand Section */}
                <NavbarBrand className='flex items-center gap-4'>
                    <img
                        src={EVRangerBanner}
                        alt='EV Ranger Logo'
                        className='w-48 h-auto'
                    />

                    {/* Tour Button - Desktop */}
                    {/* {!hideTourButton && (
                        <Button
                            size='sm'
                            color='primary'
                            variant='flat'
                            startContent={<FiPlay size={14} />}
                            onPress={() => setRun(true)}
                            className='hidden md:flex bg-primary/10 hover:bg-primary/20 text-primary font-medium'
                        >
                            Take Tour
                        </Button>
                    )} */}
                </NavbarBrand>

                {/* Desktop Navigation */}
                <NavbarContent
                    className='hidden md:flex gap-8'
                    justify='center'
                >
                    <NavbarItem>
                        <Link
                            href='/'
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                ${
                    window.location.pathname === '/explore'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-content2/50'
                }
              `}
                        >
                            <span>Explore</span>
                        </Link>
                    </NavbarItem>

                    <NavbarItem>
                        <Link
                            href='/about'
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                ${
                    window.location.pathname === '/about'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-content2/50'
                }
              `}
                        >
                            <span>About</span>
                        </Link>
                    </NavbarItem>
                </NavbarContent>

                {/* Right Section */}
                <NavbarContent justify='end' className='gap-4'>
                    {/* Theme Toggle */}
                    <NavbarItem>
                        <div className='flex items-center gap-2'>
                            <Switch
                                size='sm'
                                isSelected={!isDarkMode}
                                onValueChange={() => toggleTheme()}
                                startContent={<SunIcon />}
                                endContent={<MoonIcon />}
                                classNames={{
                                    wrapper: [
                                        'group-data-[selected=true]:bg-primary',
                                        'bg-content3',
                                        'hover:border-primary/20 transition-colors'
                                    ].join(' '),
                                    thumb: [
                                        'group-data-[selected=true]:bg-white',
                                        'bg-white shadow-lg'
                                    ].join(' ')
                                }}
                            />
                        </div>
                    </NavbarItem>
                </NavbarContent>
            </div>

            {/* Mobile Menu */}
            <NavbarMenu className='bg-background/95 backdrop-blur-lg border-t border-divider/30'>
                <div className='flex flex-col gap-4 pt-6'>
                    <NavbarMenuItem>
                        <Link
                            href='/'
                            onPress={() => setIsMenuOpen(false)}
                            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full
                ${
                    window.location.pathname === '/'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-content2/50'
                }
              `}
                        >
                            <FiZap size={18} />
                            <span className='font-medium'>Explore EVs</span>
                        </Link>
                    </NavbarMenuItem>

                    <NavbarMenuItem>
                        <Link
                            href='/about'
                            onPress={() => setIsMenuOpen(false)}
                            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full
                ${
                    window.location.pathname === '/about'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-content2/50'
                }
              `}
                        >
                            <FiInfo size={18} />
                            <span className='font-medium'>About</span>
                        </Link>
                    </NavbarMenuItem>

                    {/* Mobile Tour Button */}
                    {/* {!hideTourButton && (
                        <NavbarMenuItem className='pt-4 border-t border-divider/30'>
                            <Button
                                size='md'
                                color='primary'
                                variant='flat'
                                startContent={<FiPlay size={16} />}
                                onPress={() => {
                                    setRun(true)
                                    setIsMenuOpen(false)
                                }}
                                className='w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium'
                            >
                                Take Interactive Tour
                            </Button>
                        </NavbarMenuItem>
                    )} */}
                </div>
            </NavbarMenu>
        </Navbar>
    )
}
