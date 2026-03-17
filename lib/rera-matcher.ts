import { supabaseAdmin } from './supabase';
import { RERAProject } from '@/types';

// Haversine distance between two coordinates in meters
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Find nearest RERA project within 200m of a detected site
export async function findNearestRERAProject(lat: number, lng: number): Promise<RERAProject | null> {
  const { data: projects } = await supabaseAdmin
    .from('rera_projects')
    .select('*')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (!projects?.length) return null;

  let nearest: RERAProject | null = null;
  let minDist = Infinity;

  for (const project of projects) {
    const dist = haversineDistance(lat, lng, project.lat, project.lng);
    if (dist < 200 && dist < minDist) {
      minDist = dist;
      nearest = project;
    }
  }

  return nearest;
}
