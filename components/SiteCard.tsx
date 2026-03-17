'use client';
import { Site } from '@/types';
import { HotScoreBadge } from './HotScoreBadge';
import { useState } from 'react';

const typeColors: Record<string, string> = {
  'Residential': 'bg-green-100 text-green-700',
  'Commercial': 'bg-red-100 text-red-700',
  'Builder Project': 'bg-blue-100 text-blue-700',
  'Unknown': 'bg-gray-100 text-gray-600',
};

const stageColors: Record<string, string> = {
  'Excavation': 'bg-orange-100 text-orange-700',
  'Foundation': 'bg-yellow-100 text-yellow-700',
  'Structure': 'bg-blue-100 text-blue-700',
  'Finishing': 'bg-green-100 text-green-700',
  'Unknown': 'bg-gray-100 text-gray-600',
};

interface SiteCardProps {
  site: Site;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Site>) => void;
}

export function SiteCard({ site, onClose, onUpdate }: SiteCardProps) {
  const [notes, setNotes] = useState(site.notes || '');
  const [saving, setSaving] = useState(false);
  const [reported, setReported] = useState(false);

  const mapsUrl = `https://www.google.com/maps?q=${site.lat},${site.lng}`;
  
  const whatsappText = encodeURIComponent(
    `🏗️ Construction site detected!\nType: ${site.type}\nStage: ${site.stage}\nConfidence: ${site.confidence}%\nLocation: https://www.google.com/maps?q=${site.lat},${site.lng}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  const handleVisitToggle = async () => {
    onUpdate(site.id, { visited: !site.visited });
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    onUpdate(site.id, { notes });
    setSaving(false);
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[site.type]}`}>
                {site.type}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stageColors[site.stage]}`}>
                {site.stage}
              </span>
              <HotScoreBadge score={site.hot_score} />
            </div>
            <p className="text-xs text-gray-500">
              {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xl font-bold text-gray-900">{site.confidence}%</div>
          <div className="text-xs text-gray-500">Confidence</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xl font-bold text-gray-900">
            {site.sqft_estimate ? `${site.sqft_estimate.toLocaleString()}` : '—'}
          </div>
          <div className="text-xs text-gray-500">Est. sqft</div>
        </div>
      </div>

      {/* Signals */}
      {site.signals_detected?.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Detected signals</p>
          <div className="flex flex-wrap gap-1">
            {site.signals_detected.slice(0, 4).map((signal, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* RERA Info */}
      {site.rera_project && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">📋 RERA Registered</p>
          <p className="text-sm font-semibold text-gray-900">{site.rera_project.project_name}</p>
          <p className="text-xs text-gray-600">{site.rera_project.promoter_name}</p>
          {site.rera_project.promoter_contact && (
            <a
              href={`tel:${site.rera_project.promoter_contact}`}
              className="text-xs text-blue-600 font-medium mt-1 block"
            >
              📞 {site.rera_project.promoter_contact}
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="px-4 pb-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes about this site..."
          className="w-full text-sm border border-gray-200 rounded-xl p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
        {notes !== (site.notes || '') && (
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="mt-1 text-xs text-blue-600 font-medium"
          >
            {saving ? 'Saving...' : 'Save notes'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-blue-600 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-blue-700 transition-colors"
        >
          📍 Navigate
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-green-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-600 transition-colors"
        >
          💬 Share
        </a>
        <button
          onClick={handleVisitToggle}
          className={`flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl py-2.5 transition-colors ${
            site.visited
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {site.visited ? '✅ Visited' : '🚗 Mark visited'}
        </button>
        <button
          onClick={() => setReported(true)}
          className={`flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl py-2.5 transition-colors ${
            reported ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-500 hover:bg-red-100'
          }`}
          disabled={reported}
        >
          {reported ? '👎 Reported' : '👎 Wrong'}
        </button>
      </div>
    </div>
  );
}
