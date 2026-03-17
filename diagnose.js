const fs = require('fs');

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const idx = line.indexOf('=');
  if (idx > 0) acc[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  return acc;
}, {});

async function main() {
  // Step 1: Fetch a satellite tile from a known construction area in Noida Sector 137
  const lat = 28.507;
  const lng = 77.408;
  
  console.log(`\n=== Fetching satellite tile at (${lat}, ${lng}) zoom=18 ===`);
  const tileUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=640x640&maptype=satellite&key=${env.GOOGLE_MAPS_STATIC_API_KEY}`;
  const tileResp = await fetch(tileUrl);
  if (!tileResp.ok) {
    console.error('Tile fetch failed:', tileResp.status);
    return;
  }
  const tileBuffer = await tileResp.arrayBuffer();
  const base64 = Buffer.from(tileBuffer).toString('base64');
  
  // Save the tile as an image for visual inspection
  fs.writeFileSync('sample_tile_z18.jpg', Buffer.from(tileBuffer));
  console.log('Saved sample_tile_z18.jpg for visual inspection');
  console.log('Tile size:', Math.round(tileBuffer.byteLength / 1024), 'KB');

  // Also fetch at zoom=17 for comparison
  console.log(`\n=== Fetching satellite tile at (${lat}, ${lng}) zoom=17 ===`);
  const tileUrl17 = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=640x640&maptype=satellite&key=${env.GOOGLE_MAPS_STATIC_API_KEY}`;
  const tileResp17 = await fetch(tileUrl17);
  if (tileResp17.ok) {
    const buf17 = await tileResp17.arrayBuffer();
    fs.writeFileSync('sample_tile_z17.jpg', Buffer.from(buf17));
    console.log('Saved sample_tile_z17.jpg for comparison');
  }

  // Step 2: Test a single Gemini API call with the tile
  console.log('\n=== Testing Gemini API with single tile ===');
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  
  const prompt = `Analyze this satellite image of an Indian city. Look for active construction: exposed soil, concrete frameworks, scaffolding, material piles, partially built structures.

Return ONLY this JSON:
{
  "has_construction": true or false,
  "type": "Residential" or "Commercial" or "Builder Project" or "Unknown",
  "stage": "Excavation" or "Foundation" or "Structure" or "Finishing" or "Unknown",
  "confidence": number 0-100,
  "sqft_estimate": number or null,
  "signals_detected": ["list", "of", "cues"]
}`;

  const geminiResp = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    })
  });

  console.log('Gemini status:', geminiResp.status);
  
  if (geminiResp.status === 429) {
    console.log('RATE LIMITED — quota not yet reset');
    const errText = await geminiResp.text();
    // Extract retry time
    const retryMatch = errText.match(/retry in ([\d.]+)s/i);
    if (retryMatch) console.log('Retry after:', retryMatch[1], 'seconds');
    return;
  }
  
  if (!geminiResp.ok) {
    console.log('Gemini error:', await geminiResp.text());
    return;
  }

  const data = await geminiResp.json();
  console.log('finishReason:', data.candidates?.[0]?.finishReason);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('\n=== RAW GEMINI RESPONSE ===');
  console.log(text);
  
  if (text) {
    try {
      const parsed = JSON.parse(text);
      console.log('\n=== PARSED RESULT ===');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Parse error, raw text above');
    }
  }
}

main();
