// Fetch a satellite tile from Google Maps Static API
// Returns base64-encoded JPEG image string
export async function fetchSatelliteTile(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=640x640&maptype=satellite&key=${process.env.GOOGLE_MAPS_STATIC_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch (err) {
    console.error('Tile fetch error:', err);
    return null;
  }
}

// Geocode an area name to get its bounding box
export async function geocodeArea(areaName: string): Promise<{
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
  center: { lat: number; lng: number };
} | null> {
  try {
    const encoded = encodeURIComponent(areaName);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results[0]) return null;
    
    const result = data.results[0];
    const bounds = result.geometry.bounds || result.geometry.viewport;
    const location = result.geometry.location;
    
    let finalBounds = {
      northeast: bounds.northeast,
      southwest: bounds.southwest
    };

    const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
    const lngDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);
    
    // Roughly check if larger than 3km (0.027 degrees)
    if (latDiff > 0.027 || lngDiff > 0.027) {
      const centerLat = (bounds.northeast.lat + bounds.southwest.lat) / 2;
      const centerLng = (bounds.northeast.lng + bounds.southwest.lng) / 2;
      const delta = 0.015; // ~1.5km radius
      
      finalBounds = {
        northeast: { lat: centerLat + delta, lng: centerLng + delta },
        southwest: { lat: centerLat - delta, lng: centerLng - delta }
      };
    }

    return {
      ...finalBounds,
      center: { lat: location.lat, lng: location.lng }
    };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}
