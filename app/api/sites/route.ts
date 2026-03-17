import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const areaName = searchParams.get('area');
  const type = searchParams.get('type');
  const hotOnly = searchParams.get('hot') === 'true';

  let query = supabase
    .from('sites')
    .select(`*`)
    .eq('has_construction', true)
    .order('confidence', { ascending: false });

  if (areaName) query = query.eq('area_name', areaName);
  if (type && type !== 'All') query = query.eq('type', type);
  if (hotOnly) query = query.in('hot_score', ['HOT', 'WARM']);

  const { data: sitesData, error } = await query;
  if (error) {
    console.error('Supabase /api/sites error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  // Manually join RERA projects to bypass schema cache issues
  const reraProjectIds = sitesData
    ?.map(s => s.rera_project_id)
    .filter(id => id != null) as string[] || [];

  let reraMap = new Map();
  if (reraProjectIds.length > 0) {
    const { data: reraData } = await supabase
      .from('rera_projects')
      .select('*')
      .in('id', reraProjectIds);
      
    if (reraData) {
      reraData.forEach(p => reraMap.set(p.id, p));
    }
  }

  const result = sitesData?.map(site => ({
    ...site,
    rera_project: site.rera_project_id ? reraMap.get(site.rera_project_id) || null : null
  }));

  return NextResponse.json(result || []);
}
