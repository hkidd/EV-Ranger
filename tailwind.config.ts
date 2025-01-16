import { nextui } from '@nextui-org/react'
import type { Config } from 'tailwindcss'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4ECCA3',
        secondary: '#393E46'
      },
      height: {
        'screen-minus-header': 'calc(100vh - 6rem)'
      }
    }
  },
  darkMode: 'class',
  plugins: [nextui()]
} satisfies Config
