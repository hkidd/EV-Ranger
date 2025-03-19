import env from '../config/env'

interface GeocodingResponse {
  features: {
    id: string
    text: string
    center: [number, number]
    place_name: string
    properties?: {
      type?: string
    }
  }[]
}

export interface RouteResponse {
  route: {
    geometry: {
      type: string
      coordinates: [number, number][]
    }
    distance: number
  }
  error?: string
}

export const searchLocation = async (
  query: string,
  limit: number = 5,
  proximity?: [number, number]
): Promise<GeocodingResponse> => {
  try {
    const response = await fetch(`${env.API_BASE_URL}/geocoding/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, limit, proximity })
    })

    if (!response.ok) {
      throw new Error('Failed to search location')
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching location:', error)
    throw error
  }
}

// export const fetchChargingStations = async (
//   center: [number, number],
//   radius: number
// ): Promise<{ stations: ChargingStation[]; error?: string }> => {
//   try {
//     const response = await fetch(`${env.API_BASE_URL}/charging-stations`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ center, radius })
//     })

//     if (!response.ok) {
//       throw new Error('Failed to fetch charging stations')
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Error fetching charging stations:', error)
//     return { stations: [], error: 'Failed to fetch charging stations' }
//   }
// }

// export const getRoute = async (
//   start: [number, number],
//   end: [number, number]
// ): Promise<RouteResponse> => {
//   try {
//     const response = await fetch(`${env.API_BASE_URL}/directions`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ start, end })
//     })

//     if (!response.ok) {
//       throw new Error('Failed to get route')
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Error getting route:', error)
//     return {
//       route: { geometry: { type: 'LineString', coordinates: [] }, distance: 0 },
//       error: 'Failed to get route'
//     }
//   }
// }
