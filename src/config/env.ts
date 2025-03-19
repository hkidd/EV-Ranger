/**
 * Application environment configuration
 * This centralizes access to environment variables and provides defaults
 * for local development when environment variables are not set
 */
const env = {
  /**
   * Mapbox access token
   * Get your token from https://account.mapbox.com/
   * For Vite, this should be set as VITE_MAPBOX_TOKEN in your .env file
   */
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',

  /**
   * API base URL
   * Automatically switches between development and production URLs
   * based on the current environment
   */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,

  /**
   * Default map settings
   */
  MAP_DEFAULTS: {
    // Center of continental US
    DEFAULT_CENTER: [-98.5795, 39.8283] as [number, number],
    DEFAULT_ZOOM: 4,
    // Rough bounds of continental US
    US_BOUNDS: [-125.0, 24.0, -66.0, 50.0] as [number, number, number, number]
  },

  /**
   * API endpoints
   */
  API: {
    // If you integrate with a real charging station API, add the URL here
    CHARGING_STATIONS_API: ''
  },

  /**
   * Feature flags
   */
  FEATURES: {
    ENABLE_ISOCHRONES: true,
    ENABLE_CHARGING_STATIONS: true,
    ENABLE_TERRAIN_VISUALIZATION: true
  }
}

/**
 * Validates that required environment variables are set
 * Call this during app initialization to ensure all required variables are present
 */
export function validateEnv(): boolean {
  if (!env.MAPBOX_TOKEN) {
    console.error('Missing required environment variable: VITE_MAPBOX_TOKEN')
    console.error('Please add VITE_MAPBOX_TOKEN to your .env file')
    return false
  }

  if (!env.API_BASE_URL) {
    console.error('Missing required environment variable: VITE_API_BASE_URL')
    console.error('Please add VITE_API_BASE_URL to your .env file')
    return false
  }

  return true
}

export default env
