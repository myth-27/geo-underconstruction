import { NextRequest } from 'next/server';
import { geocodeArea } from '@/lib/maps';
import { generateGrid } from '@/lib/grid';
import { fetchSatelliteTile } from '@/lib/maps';
import { classifyTile, classifyTileBatch } from '@/lib/gemini';
import { calculateHotScore } from '@/lib/scoring';
import { findNearestRERAProject } from '@/lib/rera-matcher';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 300; // 5 min timeout for Vercel

export async function POST(request: NextRequest) {
  const { areaName } = await request.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Run scan in background
  (async () => {
    try {
      // Step 1: Geocode the area
      await send({ status: 'scanning', message: `Finding ${areaName}...`, current: 0, total: 0, found: 0 });
      
      const bounds = await geocodeArea(areaName);
      if (!bounds) {
        await send({ status: 'error', message: 'Could not find this location. Try a more specific name like "Noida Sector 62".' });
        await writer.close();
        return;
      }

      const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat);
      const lngDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng);
      const heightKm = latDiff * 111;
      const widthKm = lngDiff * 111 * Math.cos((bounds.northeast.lat + bounds.southwest.lat) / 2 * (Math.PI / 180));
      console.log(`Bounding box dimensions: ${widthKm.toFixed(2)}km x ${heightKm.toFixed(2)}km`);

      // Step 2: Generate grid (limited to 20 tiles for testing)
      const grid = generateGrid(bounds.northeast, bounds.southwest, 150).slice(0, 20);
      await send({ status: 'scanning', message: `Scanning ${grid.length} tiles in ${areaName}...`, current: 0, total: grid.length, found: 0 });

      let found = 0;

      const batchDelay = 10000; // 6 RPM — extremely safe for free tier
      console.log("Using 10s batch delay (6 RPM) — within Gemini free-tier limits.");

      // Step 3: Process tiles in batches
      const BATCH_SIZE = 4;
      for (let i = 0; i < grid.length; i += BATCH_SIZE) {
        const batch = grid.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(grid.length / BATCH_SIZE);
        console.log(`Processing batch ${batchNumber} of ${totalBatches} (tiles ${i}-${i + batch.length - 1})`);

        // Fetch satellite tiles in parallel
        const tilePromises = batch.map(point => fetchSatelliteTile(point.lat, point.lng));
        const tilesBase64 = await Promise.all(tilePromises);
        
        const batchSites: any[] = [];

        // Filter valid tiles to send to Gemini
        const validTiles: { img: string, point: any, originalIndex: number }[] = [];
        let tileFailures = 0;
        tilesBase64.forEach((tile, idx) => {
          if (tile) validTiles.push({ img: tile, point: batch[idx], originalIndex: idx });
          else tileFailures++;
          console.log(`Tile fetched (${batch[idx].lat}, ${batch[idx].lng}): ${tile ? 'yes' : 'NO — Maps API error'}`);
        });
        if (tileFailures === batch.length) {
          console.error(`All ${batch.length} tiles failed to fetch — check GOOGLE_MAPS_STATIC_API_KEY`);
          await send({ status: 'scanning', message: `Batch ${batchNumber}/${totalBatches}: All tile fetches failed — check Maps API key`, current: Math.min(i + BATCH_SIZE, grid.length), total: grid.length, found });
        }

        if (validTiles.length > 0) {
          // Classify batch with Gemini
          const classifications = await classifyTileBatch(validTiles.map(v => v.img));
          console.log(`Classification result for batch ${batchNumber}:`, JSON.stringify(classifications));

          if (!classifications) {
            console.error(`Gemini returned null for batch ${batchNumber} — API error or model issue`);
            await send({ status: 'scanning', message: `Batch ${batchNumber}/${totalBatches}: Gemini classification failed (check server logs)`, current: Math.min(i + BATCH_SIZE, grid.length), total: grid.length, found });
          }

          if (classifications && Array.isArray(classifications)) {
            let foundInBatch = 0;
            for (const classification of classifications) {
              const tileData = validTiles[classification.image_index - 1];
              if (!tileData) continue;
              
              const point = tileData.point;

              // Only save if construction detected
              if (classification.has_construction && classification.confidence >= 20) {
                const hotScore = calculateHotScore(classification.confidence, classification.stage);
                const reraProject = await findNearestRERAProject(point.lat, point.lng);
                
                // Check for duplicates (within ~50 meters)
                const latDiff = 0.00045;
                const lngDiff = 0.00045;
                
                const { data: existingSites } = await supabaseAdmin
                  .from('sites')
                  .select('*')
                  .gte('lat', point.lat - latDiff)
                  .lte('lat', point.lat + latDiff)
                  .gte('lng', point.lng - lngDiff)
                  .lte('lng', point.lng + lngDiff)
                  .limit(1);

                const isDuplicate = existingSites && existingSites.length > 0;

                if (!isDuplicate) {
                  const dbSite = {
                    lat: point.lat,
                    lng: point.lng,
                    has_construction: true,
                    type: classification.type,
                    stage: classification.stage,
                    confidence: classification.confidence,
                    sqft_estimate: classification.sqft_estimate,
                    signals_detected: classification.signals_detected,
                    hot_score: hotScore,
                    area_name: areaName,
                    rera_project_id: reraProject?.id || null,
                  };
                  const { data: insertedSite } = await supabaseAdmin.from('sites').insert(dbSite).select().single();
                  if (insertedSite) {
                    batchSites.push(insertedSite);
                  }
                  found++;
                  foundInBatch++;
                } else if (existingSites) {
                  // Push the existing site to the UI stream so it still looks like we "found" it
                  batchSites.push(existingSites[0]);
                  found++;
                  foundInBatch++;
                }
              }
            }
            console.log(`Batch ${batchNumber} complete: found ${foundInBatch} construction sites.`);
          }
        }

        // Send progress update after each batch
        const currentProcessed = Math.min(i + BATCH_SIZE, grid.length);
        await send({
          status: 'scanning',
          message: `Scanning tile ${currentProcessed} of ${grid.length}...`,
          current: currentProcessed,
          total: grid.length,
          found,
          newSites: batchSites
        });

        // Dynamic delay between BATCHES
        await new Promise(r => setTimeout(r, batchDelay));
      }

      await send({
        status: 'complete',
        message: `Done! Found ${found} construction sites in ${areaName}.`,
        current: grid.length,
        total: grid.length,
        found
      });

    } catch (err) {
      console.error('Scan error:', err);
      await send({ status: 'error', message: 'Scan failed. Please try again.' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
