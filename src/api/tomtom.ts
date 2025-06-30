const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TomTomReachableRangeRequest {
  latitude: number;
  longitude: number;
  energyBudgetInkWh: number;
  routeType?: 'eco' | 'fast' | 'shortest';
}

export interface TomTomReachableRangeResponse {
  success: boolean;
  data: {
    reachableRange: {
      boundary: Array<{
        latitude: number;
        longitude: number;
      }>;
      center: {
        latitude: number;
        longitude: number;
      };
    };
  };
  source: string;
}

export interface TomTomEvRouteRequest {
  origin: string;
  destination: string;
  currentChargeInkWh: number;
  maxChargeInkWh: number;
  auxiliaryPowerInkW?: number;
  constantSpeedConsumptionInkWhPerHundredkm?: string;
}

export interface TomTomChargingStationsRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

export const tomtomApi = {
  async getReachableRange(params: TomTomReachableRangeRequest): Promise<TomTomReachableRangeResponse> {
    const response = await fetch(`${API_BASE_URL}/tomtom/reachable-range`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get reachable range');
    }

    return response.json();
  },

  async getEvRoute(params: TomTomEvRouteRequest) {
    const response = await fetch(`${API_BASE_URL}/api/tomtom/ev-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get EV route');
    }

    return response.json();
  },

  async getChargingStations(params: TomTomChargingStationsRequest) {
    const response = await fetch(`${API_BASE_URL}/api/tomtom/charging-stations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get charging stations');
    }

    return response.json();
  },
};

// Utility function to convert UI-calculated range to kWh energy budget
export function convertEpaRangeToEnergyBudget(
  adjustedRangeMiles: number,
  batteryCapacityKwh: number,
  efficiencyFactor: number = 1.0
): number {
  // Use a more realistic efficiency for modern EVs
  // This should match the efficiency assumptions used in the UI calculations
  const avgEfficiencyMilesPerKwh = 4.0;
  
  // Calculate energy needed for the UI-adjusted range
  const energyBudgetKwh = (adjustedRangeMiles * efficiencyFactor) / avgEfficiencyMilesPerKwh;
  
  // Don't artificially cap the energy budget - trust the UI calculations
  // The UI has already applied battery %, temperature, and other adjustments
  // Only apply a safety maximum to prevent unrealistic values
  const maxReasonableEnergyBudget = batteryCapacityKwh * 2.0; // Allow up to 200% for safety
  
  return Math.min(energyBudgetKwh, maxReasonableEnergyBudget);
}

// Utility to convert TomTom boundary to GeoJSON polygon
export function tomtomBoundaryToGeoJson(boundary: Array<{ latitude: number; longitude: number }>) {
  // TomTom returns boundary points, convert to GeoJSON Polygon format
  const coordinates = boundary.map(point => [point.longitude, point.latitude]);
  
  // Close the polygon by adding the first point at the end
  if (coordinates.length > 0) {
    coordinates.push(coordinates[0]);
  }

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coordinates]
    }
  };
}