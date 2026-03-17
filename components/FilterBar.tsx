'use client';

const FILTERS = ['All', 'Residential', 'Commercial', 'Builder Project', 'HOT only'];

interface FilterBarProps {
  active: string;
  onChange: (filter: string) => void;
  counts: Record<string, number>;
}

export function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            active === f
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
          }`}
        >
          {f}
          {counts[f] !== undefined && (
            <span className={`ml-1.5 text-xs ${active === f ? 'text-gray-300' : 'text-gray-400'}`}>
              {counts[f]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
