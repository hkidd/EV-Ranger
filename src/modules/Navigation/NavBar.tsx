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
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar
} from '@nextui-org/react'
import EVRangerBanner from '../../assets/Logos/BannerNoBkgNoSlogan.svg'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { SunIcon, MoonIcon } from './ThemeIcons'
import {
    FiInfo,
    FiZap,
    FiMessageSquare,
    FiLogIn,
    FiUserPlus,
    FiLogOut,
    FiUser
} from 'react-icons/fi'
import { toast } from 'react-toastify'

// interface NavBarProps {
//     setRun: React.Dispatch<React.SetStateAction<boolean>>
//     hideTourButton: boolean
// }

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { isDarkMode, toggleTheme } = useTheme()
    const { currentUser, userProfile, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
            toast.success('Signed out successfully')
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to sign out')
        }
    }

    return (
        <Navbar
            maxWidth='full'
            className='bg-background/80 backdrop-blur-lg'
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

                    <NavbarItem>
                        <Link
                            href='/explore'
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
                            href='/feedback'
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                ${
                    window.location.pathname === '/feedback'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-content2/50'
                }
              `}
                        >
                            <span>Feedback</span>
                        </Link>
                    </NavbarItem>
                </NavbarContent>

                {/* Right Section */}
                <NavbarContent justify='end' className='gap-4'>
                    {/* Authentication */}
                    {currentUser ? (
                        <NavbarItem>
                            <Dropdown placement='bottom-end'>
                                <DropdownTrigger>
                                    <Avatar
                                        as='button'
                                        className='transition-transform'
                                        src={currentUser.photoURL || undefined}
                                        name={
                                            userProfile?.displayName ||
                                            currentUser.email ||
                                            'User'
                                        }
                                        size='sm'
                                        showFallback
                                        fallback={
                                            <FiUser className='w-4 h-4' />
                                        }
                                    />
                                </DropdownTrigger>
                                <DropdownMenu aria-label='User menu'>
                                    <DropdownItem
                                        key='profile'
                                        className='h-14 gap-2'
                                    >
                                        <p className='font-semibold'>
                                            Signed in as
                                        </p>
                                        <p className='font-semibold'>
                                            {userProfile?.displayName ||
                                                currentUser.email}
                                        </p>
                                    </DropdownItem>
                                    <DropdownItem
                                        key='logout'
                                        color='danger'
                                        startContent={<FiLogOut />}
                                        onPress={handleLogout}
                                    >
                                        Sign Out
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </NavbarItem>
                    ) : (
                        <NavbarItem className='hidden md:flex gap-2'>
                            <Button
                                as={Link}
                                href='/login'
                                variant='light'
                                startContent={<FiLogIn />}
                                className='text-foreground/70 hover:text-foreground'
                            >
                                Sign In
                            </Button>
                            <Button
                                as={Link}
                                href='/signup'
                                color='primary'
                                startContent={<FiUserPlus />}
                            >
                                Sign Up
                            </Button>
                        </NavbarItem>
                    )}

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
                            href='/feedback'
                            onPress={() => setIsMenuOpen(false)}
                            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full
                ${
                    window.location.pathname === '/feedback'
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-content2/50'
                }
              `}
                        >
                            <FiMessageSquare size={18} />
                            <span className='font-medium'>Feedback</span>
                        </Link>
                    </NavbarMenuItem>

                    {/* Mobile Auth Buttons */}
                    <NavbarMenuItem className='pt-4 border-t border-divider/30'>
                        {currentUser ? (
                            <div className='space-y-3'>
                                <div className='flex items-center gap-3 p-3 rounded-xl bg-content2/50'>
                                    <Avatar
                                        src={currentUser.photoURL || undefined}
                                        name={
                                            userProfile?.displayName ||
                                            currentUser.email ||
                                            'User'
                                        }
                                        size='sm'
                                        showFallback
                                        fallback={
                                            <FiUser className='w-4 h-4' />
                                        }
                                    />
                                    <div>
                                        <p className='font-medium text-foreground'>
                                            {userProfile?.displayName || 'User'}
                                        </p>
                                        <p className='text-sm text-foreground/60'>
                                            {currentUser.email}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant='flat'
                                    color='danger'
                                    size='md'
                                    startContent={<FiLogOut size={16} />}
                                    onPress={() => {
                                        handleLogout()
                                        setIsMenuOpen(false)
                                    }}
                                    className='w-full'
                                >
                                    Sign Out
                                </Button>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                <Button
                                    as={Link}
                                    href='/login'
                                    variant='flat'
                                    size='md'
                                    startContent={<FiLogIn size={16} />}
                                    onPress={() => setIsMenuOpen(false)}
                                    className='w-full'
                                >
                                    Sign In
                                </Button>
                                <Button
                                    as={Link}
                                    href='/signup'
                                    color='primary'
                                    size='md'
                                    startContent={<FiUserPlus size={16} />}
                                    onPress={() => setIsMenuOpen(false)}
                                    className='w-full'
                                >
                                    Sign Up
                                </Button>
                            </div>
                        )}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </Navbar>
    )
}
