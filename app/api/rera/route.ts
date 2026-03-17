import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Seed some sample Noida RERA projects for testing
// In production this would scrape up-rera.in
export async function POST() {
  const sampleProjects = [
    {
      project_name: 'ATS Pristine',
      promoter_name: 'ATS Infrastructure Ltd',
      promoter_contact: '0120-4567890',
      address: 'Sector 150, Noida, UP',
      lat: 28.4744,
      lng: 77.5040,
      registration_no: 'UPRERAPRJ123456',
      registration_date: '2023-01-15',
      status: 'Ongoing',
      total_area: '50000 sqm'
    },
    {
      project_name: 'Gaur City 2',
      promoter_name: 'Gaursons India Ltd',
      promoter_contact: '0120-7654321',
      address: 'Sector 16C, Greater Noida West',
      lat: 28.6139,
      lng: 77.4364,
      registration_no: 'UPRERAPRJ234567',
      registration_date: '2022-06-20',
      status: 'Ongoing',
      total_area: '80000 sqm'
    },
    {
      project_name: 'Mahagun Medalleo',
      promoter_name: 'Mahagun India Pvt Ltd',
      promoter_contact: '0120-3456789',
      address: 'Sector 107, Noida',
      lat: 28.5743,
      lng: 77.3748,
      registration_no: 'UPRERAPRJ345678',
      registration_date: '2023-03-10',
      status: 'Ongoing',
      total_area: '35000 sqm'
    },
    {
      project_name: 'Godrej Woods',
      promoter_name: 'Godrej Properties Ltd',
      promoter_contact: '022-67196500',
      address: 'Sector 43, Noida',
      lat: 28.5535,
      lng: 77.3607,
      registration_no: 'UPRERAPRJ456789',
      registration_date: '2023-07-01',
      status: 'Ongoing',
      total_area: '45000 sqm'
    },
    {
      project_name: 'Supertech Supernova',
      promoter_name: 'Supertech Ltd',
      promoter_contact: '0120-4577700',
      address: 'Sector 94, Noida',
      lat: 28.5289,
      lng: 77.3468,
      registration_no: 'UPRERAPRJ567890',
      registration_date: '2022-11-05',
      status: 'Ongoing',
      total_area: '60000 sqm'
    }
  ];

  const { error } = await supabaseAdmin.from('rera_projects').upsert(sampleProjects, {
    onConflict: 'registration_no'
  });

  if (error) {
    console.error('Supabase upsert error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ message: `Seeded ${sampleProjects.length} RERA projects` });
}
