'use client';
import { ScanProgress as ScanProgressType } from '@/types';

export function ScanProgress({ progress }: { progress: ScanProgressType }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛰️</div>
          <h3 className="text-lg font-bold text-gray-900">Scanning from satellite...</h3>
          <p className="text-sm text-gray-500 mt-1">{progress.message}</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-gray-900">{progress.current}</div>
            <div className="text-xs text-gray-500">Scanned</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
            <div className="text-xs text-gray-500">Total tiles</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-600">{progress.found}</div>
            <div className="text-xs text-gray-500">Sites found</div>
          </div>
        </div>

        {/* Live Sites Feed */}
        {progress.newSites && progress.newSites.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Live Detections</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {progress.newSites.map((site: any, idx) => (
                <div key={site.id || idx} className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-left animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{site.type}</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{site.confidence}%</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{site.stage} Stage</div>
                  {site.signals_detected && site.signals_detected.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {site.signals_detected.slice(0, 3).map((signal: string) => (
                         <span key={signal} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                           {signal}
                         </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
