export type SiteType = 'Residential' | 'Commercial' | 'Builder Project' | 'Unknown';
export type SiteStage = 'Excavation' | 'Foundation' | 'Structure' | 'Finishing' | 'Unknown';
export type HotScore = 'HOT' | 'WARM' | 'COLD' | 'UNVERIFIED';

export interface Site {
  id: string;
  lat: number;
  lng: number;
  has_construction: boolean;
  type: SiteType;
  stage: SiteStage;
  confidence: number;
  sqft_estimate: number | null;
  signals_detected: string[];
  hot_score: HotScore;
  area_name: string;
  visited: boolean;
  notes: string | null;
  rera_project_id: string | null;
  scanned_at: string;
  rera_project?: RERAProject;
}

export interface RERAProject {
  id: string;
  project_name: string;
  promoter_name: string;
  promoter_contact: string;
  address: string;
  lat: number;
  lng: number;
  registration_no: string;
  registration_date: string;
  status: string;
  total_area: string;
}

export interface GeminiClassification {
  has_construction: boolean;
  type: SiteType;
  stage: SiteStage;
  confidence: number;
  sqft_estimate: number | null;
  signals_detected: string[];
}

export interface ScanProgress {
  current: number;
  total: number;
  found: number;
  status: 'scanning' | 'complete' | 'error';
  message: string;
  newSites?: any[];
}
