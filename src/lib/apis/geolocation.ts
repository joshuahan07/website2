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
