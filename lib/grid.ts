interface Coordinate {
  lat: number;
  lng: number;
}

// Generate a grid of coordinate points covering a bounding box
// spacing: distance between points in meters (default 100m)
export function generateGrid(
  northeast: Coordinate,
  southwest: Coordinate,
  spacingMeters: number = 100
): Coordinate[] {
  const points: Coordinate[] = [];
  
  // Convert meters to degrees (approximate)
  const latStep = spacingMeters / 111000;
  const lngStep = spacingMeters / (111000 * Math.cos((northeast.lat + southwest.lat) / 2 * Math.PI / 180));
  
  let lat = southwest.lat;
  while (lat <= northeast.lat) {
    let lng = southwest.lng;
    while (lng <= northeast.lng) {
      points.push({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      lng += lngStep;
    }
    lat += latStep;
  }
  
  // Cap at 600 points to stay within free tier limits
  if (points.length > 600) {
    const step = Math.ceil(points.length / 600);
    return points.filter((_, i) => i % step === 0);
  }
  
  return points;
}
