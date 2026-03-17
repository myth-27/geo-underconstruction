'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Site } from '@/types';
import { Map } from '@/components/Map';
import { SiteCard } from '@/components/SiteCard';
import { FilterBar } from '@/components/FilterBar';
import { SiteList } from '@/components/SiteList';
import Script from 'next/script';

function Dashboard() {
  const searchParams = useSearchParams();
  const areaName = searchParams.get('area') || '';

  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load sites
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (areaName) params.set('area', areaName);
      const res = await fetch(`/api/sites?${params}`);
      const data = await res.json();
      setSites(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, [areaName]);

  // Apply filters
  useEffect(() => {
    let filtered = sites;
    if (activeFilter === 'HOT only') {
      filtered = sites.filter(s => s.hot_score === 'HOT' || s.hot_score === 'WARM');
    } else if (activeFilter !== 'All') {
      filtered = sites.filter(s => s.type === activeFilter);
    }
    setFilteredSites(filtered);
  }, [sites, activeFilter]);

  // Filter counts
  const counts = {
    All: sites.length,
    Residential: sites.filter(s => s.type === 'Residential').length,
    Commercial: sites.filter(s => s.type === 'Commercial').length,
    'Builder Project': sites.filter(s => s.type === 'Builder Project').length,
    'HOT only': sites.filter(s => s.hot_score === 'HOT' || s.hot_score === 'WARM').length,
  };

  const handleSiteUpdate = useCallback(async (id: string, updates: Partial<Site>) => {
    await fetch(`/api/sites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (selectedSite?.id === id) {
      setSelectedSite(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedSite]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-10">
        <a href="/" className="font-black text-gray-900 text-lg">
          Construct<span className="text-blue-600">IQ</span>
        </a>
        <div className="flex-1 overflow-hidden">
          <FilterBar active={activeFilter} onChange={setActiveFilter} counts={counts} />
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium"
        >
          ≡ {filteredSites.length}
        </button>
        <a
          href="/"
          className="hidden md:block text-sm text-blue-600 font-medium hover:text-blue-700 whitespace-nowrap"
        >
          + New scan
        </a>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'flex' : 'hidden'} md:flex
          w-full md:w-72 lg:w-80
          absolute md:relative inset-0 md:inset-auto
          z-20 md:z-auto
          bg-white md:bg-transparent
          flex-col border-r border-gray-200 overflow-hidden
        `}>
          <div className="p-3 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {areaName || 'All areas'}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredSites.length} sites
                  {activeFilter !== 'All' && ` (${activeFilter})`}
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-400 text-xl"
              >
                ×
              </button>
            </div>
          </div>
          <SiteList
            sites={filteredSites}
            selectedId={selectedSite?.id || null}
            onSelect={(site) => {
              setSelectedSite(site);
              setSidebarOpen(false);
            }}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="text-4xl mb-3">🛰️</div>
                <p className="text-gray-600">Loading sites...</p>
              </div>
            </div>
          )}

          {mapsLoaded && (
            <Map
              sites={filteredSites}
              selectedSite={selectedSite}
              onSiteSelect={setSelectedSite}
            />
          )}

          {/* Site card */}
          {selectedSite && (
            <SiteCard
              site={selectedSite}
              onClose={() => setSelectedSite(null)}
              onUpdate={handleSiteUpdate}
            />
          )}

          {/* Stats overlay */}
          {!loading && filteredSites.length > 0 && !selectedSite && (
            <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="font-bold text-red-600">{sites.filter(s => s.hot_score === 'HOT').length}</div>
                  <div className="text-xs text-gray-500">HOT</div>
                </div>
                <div>
                  <div className="font-bold text-amber-600">{sites.filter(s => s.hot_score === 'WARM').length}</div>
                  <div className="text-xs text-gray-500">WARM</div>
                </div>
                <div>
                  <div className="font-bold text-green-600">{sites.filter(s => s.visited).length}</div>
                  <div className="text-xs text-gray-500">Visited</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setMapsLoaded(true)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
