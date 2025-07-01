// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCBiGY_D8AP65Rn8Jk3nro3mAO5sSBSi38',
  authDomain: 'ev-ranger-93e0c.firebaseapp.com',
  projectId: 'ev-ranger-93e0c',
  storageBucket: 'ev-ranger-93e0c.firebasestorage.app',
  messagingSenderId: '809432361654',
  appId: '1:809432361654:web:43188f52304cd912f91417',
  measurementId: 'G-XM98370DMH'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Social Auth Providers
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.addScope('email')
googleProvider.addScope('profile')
facebookProvider.addScope('email')
