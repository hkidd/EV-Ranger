import React, { createContext, useContext, useEffect, useState } from 'react'
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    UserCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider, facebookProvider } from '../firebase'

interface AuthContextType {
    currentUser: User | null
    userProfile: UserProfile | null
    loading: boolean
    signup: (email: string, password: string, displayName: string) => Promise<UserCredential>
    login: (email: string, password: string) => Promise<UserCredential>
    loginWithGoogle: () => Promise<UserCredential>
    loginWithFacebook: () => Promise<UserCredential>
    logout: () => Promise<void>
    updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
}

interface UserProfile {
    uid: string
    email: string
    displayName: string
    photoURL?: string
    createdAt: Date
    lastLoginAt: Date
    preferences?: {
        theme?: 'light' | 'dark' | 'system'
        units?: 'miles' | 'kilometers'
        defaultLocation?: string
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Create or update user profile in Firestore
    const createUserProfile = async (user: User): Promise<UserProfile> => {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        const now = new Date()
        let profile: UserProfile

        if (userSnap.exists()) {
            // Update existing profile
            profile = userSnap.data() as UserProfile
            profile.lastLoginAt = now
            profile.email = user.email || profile.email
            profile.displayName = user.displayName || profile.displayName
            profile.photoURL = user.photoURL || profile.photoURL
        } else {
            // Create new profile
            profile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || undefined,
                createdAt: now,
                lastLoginAt: now,
                preferences: {
                    theme: 'system',
                    units: 'miles'
                }
            }
        }

        await setDoc(userRef, profile, { merge: true })
        return profile
    }

    // Sign up with email and password
    async function signup(email: string, password: string, displayName: string) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        
        // Update the user's display name
        await updateProfile(result.user, { displayName })
        
        // Create user profile in Firestore
        await createUserProfile(result.user)
        
        return result
    }

    // Sign in with email and password
    async function login(email: string, password: string) {
        return signInWithEmailAndPassword(auth, email, password)
    }

    // Sign in with Google
    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider)
        await createUserProfile(result.user)
        return result
    }

    // Sign in with Facebook
    async function loginWithFacebook() {
        const result = await signInWithPopup(auth, facebookProvider)
        await createUserProfile(result.user)
        return result
    }

    // Sign out
    async function logout() {
        setUserProfile(null)
        return signOut(auth)
    }

    // Update user profile
    async function updateUserProfile(data: Partial<UserProfile>) {
        if (!currentUser) throw new Error('No user logged in')
        
        const userRef = doc(db, 'users', currentUser.uid)
        await setDoc(userRef, data, { merge: true })
        
        // Update local state
        if (userProfile) {
            setUserProfile({ ...userProfile, ...data })
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            
            if (user) {
                try {
                    const profile = await createUserProfile(user)
                    setUserProfile(profile)
                } catch (error) {
                    console.error('Error creating/updating user profile:', error)
                }
            } else {
                setUserProfile(null)
            }
            
            setLoading(false)
        })

        return unsubscribe
    }, [])

    const value: AuthContextType = {
        currentUser,
        userProfile,
        loading,
        signup,
        login,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        updateUserProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}