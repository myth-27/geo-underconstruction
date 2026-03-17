'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanProgress } from '@/components/ScanProgress';
import { ScanProgress as ScanProgressType } from '@/types';

const SUGGESTED_AREAS = [
  'Noida Sector 62',
  'Noida Sector 137',
  'Noida Sector 150',
  'Greater Noida West',
  'Noida Sector 78',
  'Noida Expressway',
];

export default function Home() {
  const [areaName, setAreaName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgressType | null>(null);
  const router = useRouter();

  const handleScan = async (area: string) => {
    if (!area.trim()) return;
    setScanning(true);
    setProgress({ status: 'scanning', message: 'Starting scan...', current: 0, total: 0, found: 0 });

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaName: area }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6)) as ScanProgressType;
            
            setProgress(prev => {
              // Accumulate new sites so the feed grows
              const accumulatedSites = [...(prev?.newSites || [])];
              if (data.newSites && data.newSites.length > 0) {
                accumulatedSites.push(...data.newSites);
              }
              
              return {
                ...data,
                newSites: accumulatedSites
              };
            });

            if (data.status === 'complete') {
              setTimeout(() => {
                router.push(`/dashboard?area=${encodeURIComponent(area)}`);
              }, 1500);
            }
          } catch {}
        }
      }
    } catch (err) {
      setProgress({ status: 'error', message: 'Scan failed. Check your API keys and try again.', current: 0, total: 0, found: 0 });
    } finally {
      setScanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {scanning && progress && <ScanProgress progress={progress} />}

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Construct<span className="text-blue-500">IQ</span>
          </h1>
          <p className="text-gray-400 text-sm">AI-powered construction site detection</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-1 flex shadow-2xl mb-4">
          <input
            type="text"
            value={areaName}
            onChange={e => setAreaName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan(areaName)}
            placeholder="Enter area name... e.g. Noida Sector 62"
            className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none rounded-xl"
          />
          <button
            onClick={() => handleScan(areaName)}
            disabled={scanning || !areaName.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Scan
          </button>
        </div>

        {/* Suggested areas */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {SUGGESTED_AREAS.map(area => (
            <button
              key={area}
              onClick={() => { setAreaName(area); handleScan(area); }}
              className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors border border-white/10"
            >
              {area}
            </button>
          ))}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🛰️', label: 'Satellite scan', desc: 'AI analyses every tile' },
            { icon: '🏗️', label: 'Auto classify', desc: 'Type, stage, confidence' },
            { icon: '📍', label: 'Navigate', desc: 'One tap to Google Maps' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-semibold">{item.label}</div>
              <div className="text-gray-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Seed RERA data button */}
        <div className="text-center mt-6">
          <button
            onClick={() => fetch('/api/rera', { method: 'POST' })}
            className="text-xs text-gray-600 hover:text-gray-400 underline"
          >
            Seed sample RERA data for Noida
          </button>
        </div>
      </div>
    </main>
  );
}
