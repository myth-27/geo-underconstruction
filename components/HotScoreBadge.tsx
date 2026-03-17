import { HotScore } from '@/types';

const config: Record<HotScore, { label: string; className: string }> = {
  HOT: { label: '🔥 HOT', className: 'bg-red-100 text-red-700 border border-red-200' },
  WARM: { label: '⚡ WARM', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  COLD: { label: '❄️ COLD', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  UNVERIFIED: { label: '? UNVERIFIED', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

export function HotScoreBadge({ score }: { score: HotScore }) {
  const { label, className } = config[score];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
