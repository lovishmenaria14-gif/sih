import { InspectionRecord, LocationHeatmapPoint, HeatmapMetricMode } from '../types';

export interface KnownLocationHub {
  city: string;
  state: string;
  lat: number;
  lng: number;
  keywords: string[];
}

export const KNOWN_INDIAN_HUBS: KnownLocationHub[] = [
  {
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    keywords: ['delhi', 'karol bagh', 'okhla', 'connaught place', 'chandni chowk', 'dwarka', 'rohini', 'saket', 'nehru place', 'noida', 'gurugram', 'gurgaon']
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    keywords: ['mumbai', 'bandra', 'andheri', 'fort', 'dadar', 'thanenavi mumbai', 'kurla', 'worli', 'juhu', 'bombay']
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    keywords: ['bengaluru', 'bangalore', 'koramangala', 'indiranagar', 'whitefield', 'electronic city', 'jayanagar', 'hsr layout', 'marathahalli']
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3850,
    lng: 78.4867,
    keywords: ['hyderabad', 'hitec city', 'banjara hills', 'jubilee hills', 'secunderabad', 'gachibowli', 'madhapur', 'begumpet', 'kukatpally']
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    keywords: ['chennai', 't. nagar', 't nagar', 'adyar', 'anna nagar', 'velachery', 'guindy', 'mylapore', 'egmore', 'madras']
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    keywords: ['kolkata', 'calcutta', 'park street', 'salt lake', 'new town', 'howrah', 'burrabazar', 'alipore', 'ballygunge']
  },
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    lat: 23.0225,
    lng: 72.5714,
    keywords: ['ahmedabad', 'sg highway', 'gidc', 'maninagar', 'ashram road', 'satellite', 'bodakdev', 'naroda']
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
    keywords: ['pune', 'hinjawadi', 'kothrud', 'viman nagar', 'shivaji nagar', 'baner', 'wakad', 'hadapsar', 'magarpatta']
  },
  {
    city: 'Surat',
    state: 'Gujarat',
    lat: 21.1702,
    lng: 72.8311,
    keywords: ['surat', 'adajan', 'ring road', 'varachha', 'textile market', 'udhana']
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    keywords: ['jaipur', 'mansarovar', 'malviya nagar', 'mi road', 'c scheme', 'vaishali nagar']
  },
  {
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    keywords: ['lucknow', 'hazratganj', 'gomti nagar', 'alambagh', 'indira nagar', 'chowk']
  },
  {
    city: 'Chandigarh',
    state: 'Punjab / Haryana',
    lat: 30.7333,
    lng: 76.7794,
    keywords: ['chandigarh', 'sector 17', 'sector 35', 'mohali', 'panchkula', 'industrial area']
  },
  {
    city: 'Kochi',
    state: 'Kerala',
    lat: 9.9312,
    lng: 76.2673,
    keywords: ['kochi', 'cochin', 'edappally', 'mg road', 'kakkanad', 'marine drive', 'kaloor']
  },
  {
    city: 'Indore',
    state: 'Madhya Pradesh',
    lat: 22.7196,
    lng: 75.8577,
    keywords: ['indore', 'rajwada', 'vijay nagar', 'palasia', 'chappan dukan']
  }
];

/**
 * Resolves or estimates coordinates and city metadata for a location string.
 */
export function resolveLocationCoordinates(locationStr: string): {
  lat: number;
  lng: number;
  city: string;
  state: string;
} {
  const normalized = (locationStr || '').toLowerCase();

  for (const hub of KNOWN_INDIAN_HUBS) {
    if (hub.keywords.some((kw) => normalized.includes(kw))) {
      // Add slight deterministic jitter based on location name hash to prevent identical point stacking
      const hash = locationStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterLat = ((hash % 100) - 50) * 0.0003;
      const jitterLng = (((hash * 7) % 100) - 50) * 0.0003;
      return {
        lat: Number((hub.lat + jitterLat).toFixed(5)),
        lng: Number((hub.lng + jitterLng).toFixed(5)),
        city: hub.city,
        state: hub.state
      };
    }
  }

  // Fallback to New Delhi commercial zone
  return {
    lat: 28.6139,
    lng: 77.2090,
    city: 'New Delhi',
    state: 'Delhi'
  };
}

/**
 * Aggregates inspection test records into location heatmap points.
 */
export function aggregateLocationHeatmapPoints(records: InspectionRecord[]): LocationHeatmapPoint[] {
  const locationMap = new Map<string, {
    key: string;
    name: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    inspections: InspectionRecord[];
  }>();

  records.forEach((record) => {
    const rawLoc = record.location?.trim() || 'General Surveillance Zone';
    const coords = (record.latitude && record.longitude)
      ? { lat: record.latitude, lng: record.longitude, city: record.city || 'National Hub', state: record.state || 'India' }
      : resolveLocationCoordinates(rawLoc);

    // Grouping key: city or specific premise if notable
    const key = `${coords.city}_${Math.round(coords.lat * 100)}_${Math.round(coords.lng * 100)}`;

    if (!locationMap.has(key)) {
      locationMap.set(key, {
        key,
        name: rawLoc,
        city: coords.city,
        state: coords.state,
        lat: coords.lat,
        lng: coords.lng,
        inspections: []
      });
    }

    locationMap.get(key)!.inspections.push(record);
  });

  const points: LocationHeatmapPoint[] = [];

  locationMap.forEach((entry, id) => {
    const total = entry.inspections.length;
    const compliant = entry.inspections.filter((r) => r.overallStatus === 'COMPLIANT').length;
    const nonCompliant = entry.inspections.filter((r) => r.overallStatus === 'NON_COMPLIANT').length;
    const needsReview = entry.inspections.filter((r) => r.overallStatus === 'NEEDS_REVIEW').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    const criticalViolations = entry.inspections.reduce(
      (sum, r) => sum + (r.criticalViolationsCount || 0),
      0
    );

    const estimatedFines = entry.inspections.reduce((sum, r) => {
      const recFine = (r.penaltiesApplicable || []).reduce((pSum, p) => pSum + (p.minFineInr || 0), 0);
      return sum + recFine;
    }, 0);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (complianceRate < 35 || criticalViolations >= 3) {
      riskLevel = 'CRITICAL';
    } else if (complianceRate < 65 || nonCompliant > compliant) {
      riskLevel = 'HIGH';
    } else if (complianceRate < 85 || needsReview > 0) {
      riskLevel = 'MEDIUM';
    }

    const sortedDates = [...entry.inspections].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    points.push({
      id,
      name: entry.name,
      city: entry.city,
      state: entry.state,
      lat: entry.lat,
      lng: entry.lng,
      totalTests: total,
      compliantCount: compliant,
      nonCompliantCount: nonCompliant,
      needsReviewCount: needsReview,
      complianceRate,
      criticalViolations,
      estimatedFines,
      riskLevel,
      recentTestDate: sortedDates[0]?.createdAt || new Date().toISOString(),
      inspections: sortedDates
    });
  });

  return points.sort((a, b) => b.totalTests - a.totalTests);
}

/**
 * Returns a normalized intensity value (0 to 1) for a heatmap point based on selected metric.
 */
export function calculatePointIntensity(
  point: LocationHeatmapPoint,
  metric: HeatmapMetricMode,
  allPoints: LocationHeatmapPoint[]
): number {
  if (!allPoints.length) return 0.5;

  let value = 0;
  let max = 1;

  switch (metric) {
    case 'DENSITY': {
      value = point.totalTests;
      max = Math.max(...allPoints.map((p) => p.totalTests), 1);
      break;
    }
    case 'VIOLATIONS': {
      value = point.nonCompliantCount;
      max = Math.max(...allPoints.map((p) => p.nonCompliantCount), 1);
      break;
    }
    case 'CRITICAL': {
      value = point.criticalViolations;
      max = Math.max(...allPoints.map((p) => p.criticalViolations), 1);
      break;
    }
    case 'COMPLIANCE': {
      // Inverted: higher non-compliance or lower score gives higher heat intensity
      value = 100 - point.complianceRate;
      max = 100;
      break;
    }
    case 'PENALTIES': {
      value = point.estimatedFines;
      max = Math.max(...allPoints.map((p) => p.estimatedFines), 1);
      break;
    }
  }

  return Math.min(1, Math.max(0.15, value / (max || 1)));
}

/**
 * Converts geographic coordinates (lat, lng) to SVG 2D plane (x, y) coordinates for India bounding box.
 * Standard Mercator / Equirectangular projection tuned to India (Lat: 8°N - 36°N, Lng: 68°E - 96°E).
 */
export function projectLatLngToSvg(
  lat: number,
  lng: number,
  svgWidth = 800,
  svgHeight = 700
): { x: number; y: number } {
  // India geographic bounds
  const minLat = 8.0;
  const maxLat = 36.5;
  const minLng = 68.0;
  const maxLng = 97.0;

  const paddingX = 60;
  const paddingY = 50;

  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  // Lng maps to X (left to right)
  const normX = (lng - minLng) / (maxLng - minLng);
  const x = paddingX + normX * usableWidth;

  // Lat maps to Y (inverted: higher lat is north, i.e., smaller Y)
  const normY = (lat - minLat) / (maxLat - minLat);
  const y = paddingY + (1 - normY) * usableHeight;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10
  };
}

/**
 * Calculates great-circle distance between two GPS coordinates in kilometers using Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Finds closest monitored inspection point to a given GPS coordinate.
 */
export function findNearestHub(
  lat: number,
  lng: number,
  points: LocationHeatmapPoint[]
): { point: LocationHeatmapPoint; distanceKm: number } | null {
  if (!points || points.length === 0) return null;
  let nearest = points[0];
  let minDistance = calculateDistanceKm(lat, lng, points[0].lat, points[0].lng);

  for (let i = 1; i < points.length; i++) {
    const dist = calculateDistanceKm(lat, lng, points[i].lat, points[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = points[i];
    }
  }

  return { point: nearest, distanceKm: minDistance };
}
