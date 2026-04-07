const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * Returns distance in miles.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Format a distance in miles to a human-readable string.
 * e.g., "2,847 miles", "12 miles", "0.5 miles"
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${miles.toFixed(1)} miles`;
  }
  return `${Math.round(miles).toLocaleString('en-US')} miles`;
}

/**
 * Convert lat/lon to pixel position on a simple equirectangular world map.
 * Latitude: -90 to 90 maps to mapHeight (bottom) to 0 (top).
 * Longitude: -180 to 180 maps to 0 (left) to mapWidth (right).
 */
export function coordsToMapPosition(
  lat: number,
  lon: number,
  mapWidth: number,
  mapHeight: number
): { x: number; y: number } {
  const x = ((lon + 180) / 360) * mapWidth;
  const y = ((90 - lat) / 180) * mapHeight;

  return { x, y };
}

/**
 * Reverse geocode coordinates to a city/region name using the cse2004.com Geocoding API.
 * Returns a short location label like "St. Louis, MO" or "Tokyo, Japan".
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://cse2004.com/api/geocode?latlng=${lat},${lng}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    // Extract a short name from address components
    const components = data.results[0].address_components;
    if (components) {
      const city = components.find((c: any) =>
        c.types?.includes('locality')
      );
      const region = components.find((c: any) =>
        c.types?.includes('administrative_area_level_1')
      );
      const country = components.find((c: any) =>
        c.types?.includes('country')
      );

      if (city && region) return `${city.short_name}, ${region.short_name}`;
      if (city && country) return `${city.short_name}, ${country.short_name}`;
      if (region && country) return `${region.short_name}, ${country.short_name}`;
      if (city) return city.long_name;
      if (country) return country.long_name;
    }

    // Fallback: use the formatted address, truncated
    const formatted = data.results[0].formatted_address;
    if (formatted) {
      const parts = formatted.split(',');
      return parts.length >= 2
        ? `${parts[0].trim()}, ${parts[1].trim()}`
        : parts[0].trim();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Forward geocode an address to coordinates using the cse2004.com Geocoding API.
 * Returns { lat, lng } or null on failure.
 */
/**
 * Fetch current weather for coordinates using the cse2004.com Weather API.
 * Returns a short description like "72°F, Sunny" or null on failure.
 */
export async function fetchWeather(lat: number, lng: number): Promise<{ temp: number; description: string } | null> {
  try {
    const res = await fetch(
      `https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.temperature?.degrees;
    const desc = data?.weatherCondition?.description?.text || data?.weatherCondition?.type || '';
    if (temp == null) return null;
    return { temp: Math.round(temp), description: typeof desc === 'string' ? desc : '' };
  } catch {
    return null;
  }
}

export async function forwardGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://cse2004.com/api/geocode?address=${encodeURIComponent(address)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch {
    return null;
  }
}
