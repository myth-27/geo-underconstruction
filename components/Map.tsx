'use client';
import { useEffect, useRef, useCallback } from 'react';
import { Site } from '@/types';

const PIN_COLORS: Record<string, string> = {
  'Residential': '#16a34a',
  'Commercial': '#dc2626',
  'Builder Project': '#2563eb',
  'Unknown': '#d97706',
};

interface MapProps {
  sites: Site[];
  selectedSite: Site | null;
  onSiteSelect: (site: Site) => void;
  center?: { lat: number; lng: number };
}

export function Map({ sites, selectedSite, onSiteSelect, center }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: center || { lat: 28.5355, lng: 77.3910 }, // Default: Noida
      zoom: 13,
      mapTypeId: 'hybrid',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      mapTypeControl: true,
      streetViewControl: false,
    });
  }, [center]);

  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    sites.forEach(site => {
      const marker = new google.maps.Marker({
        position: { lat: site.lat, lng: site.lng },
        map: googleMapRef.current!,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: PIN_COLORS[site.type] || '#888',
          fillOpacity: site.visited ? 0.4 : 0.9,
          strokeColor: selectedSite?.id === site.id ? '#fff' : '#000',
          strokeWeight: selectedSite?.id === site.id ? 3 : 1,
          scale: site.hot_score === 'HOT' ? 12 : site.hot_score === 'WARM' ? 9 : 7,
        },
        title: `${site.type} — ${site.stage} (${site.confidence}%)`,
      });

      marker.addListener('click', () => onSiteSelect(site));
      markersRef.current.push(marker);
    });
  }, [sites, selectedSite, onSiteSelect]);

  // Pan to selected site
  useEffect(() => {
    if (selectedSite && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: selectedSite.lat, lng: selectedSite.lng });
    }
  }, [selectedSite]);

  return <div ref={mapRef} className="w-full h-full" />;
}
