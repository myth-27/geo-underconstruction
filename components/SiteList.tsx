'use client';
import { Site } from '@/types';
import { HotScoreBadge } from './HotScoreBadge';

interface SiteListProps {
  sites: Site[];
  selectedId: string | null;
  onSelect: (site: Site) => void;
}

const typeIcons: Record<string, string> = {
  'Residential': '🏠',
  'Commercial': '🏢',
  'Builder Project': '🏗️',
  'Unknown': '❓',
};

export function SiteList({ sites, selectedId, onSelect }: SiteListProps) {
  return (
    <div className="h-full overflow-y-auto">
      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <div className="text-3xl mb-2">🛰️</div>
          <p className="text-sm">No sites found yet</p>
          <p className="text-xs">Run a scan to detect construction</p>
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {sites.map(site => (
            <button
              key={site.id}
              onClick={() => onSelect(site)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedId === site.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {typeIcons[site.type]} {site.type}
                </span>
                <HotScoreBadge score={site.hot_score} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{site.stage}</span>
                <span>·</span>
                <span>{site.confidence}% confidence</span>
                {site.visited && <span className="text-green-600">· Visited ✓</span>}
              </div>
              {site.rera_project && (
                <p className="text-xs text-amber-600 mt-0.5 truncate">
                  📋 {site.rera_project.promoter_name}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
