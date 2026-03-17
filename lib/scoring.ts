import { HotScore, SiteStage } from '@/types';

export function calculateHotScore(confidence: number, stage: SiteStage): HotScore {
  if (confidence >= 85 && (stage === 'Structure' || stage === 'Finishing')) return 'HOT';
  if (confidence >= 65) return 'WARM';
  if (confidence >= 40) return 'COLD';
  return 'UNVERIFIED';
}
