import { GeminiClassification } from '@/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CONSTRUCTION_PROMPT = `Analyze this satellite image of an Indian city. Look for active construction: exposed soil, concrete frameworks, scaffolding, material piles, partially built structures.

Return ONLY this JSON:
{
  "has_construction": true or false,
  "type": "Residential" or "Commercial" or "Builder Project" or "Unknown",
  "stage": "Excavation" or "Foundation" or "Structure" or "Finishing" or "Unknown",
  "confidence": number 0-100,
  "sqft_estimate": number or null,
  "signals_detected": ["list", "of", "cues"]
}`;

export async function classifyTile(base64Image: string): Promise<GeminiClassification | null> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: CONSTRUCTION_PROMPT },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Gemini finishReason:', data.candidates?.[0]?.finishReason);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Strip any markdown fences if Gemini adds them
    console.log(`Raw Gemini response:`, text);
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(clean) as GeminiClassification;
      return parsed;
    } catch (parseErr) {
      console.error(`Failed to parse JSON. Cleaned response:`, clean);
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as GeminiClassification;
      }
      return null;
    }
  } catch (err) {
    console.error('Gemini classification error:', err);
    return null;
  }
}

export async function classifyTileBatch(base64Images: string[]): Promise<any[] | null> {
  try {
    const parts: any[] = [{
      text: `I am sending you ${base64Images.length} satellite images of Indian cities numbered 1 to ${base64Images.length}. 
For each image, detect active construction: exposed soil, concrete frameworks, scaffolding, material piles, partially built structures.

Return ONLY a JSON array with exactly ${base64Images.length} objects in this format:
[
  {
    "image_index": 1,
    "has_construction": true or false,
    "type": "Residential" or "Commercial" or "Builder Project" or "Unknown",
    "stage": "Excavation" or "Foundation" or "Structure" or "Finishing" or "Unknown",
    "confidence": number 0-100,
    "sqft_estimate": number or null,
    "signals_detected": ["cues"]
  }
]`
    }];

    base64Images.forEach(img => {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: img
        }
      });
    });

    let response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    });

    if (response.status === 429) {
      const errorText = await response.text();
      let waitSeconds = 45; // Default safe fallback
      const retryMatch = errorText.match(/retry in ([\d.]+)s/i);
      
      if (retryMatch && retryMatch[1]) {
        waitSeconds = Math.ceil(parseFloat(retryMatch[1])) + 2; // Exact wait + 2s buffer
      }
      
      console.log(`Rate limited on first attempt. Waiting exactly ${waitSeconds}s before retry...`);
      await new Promise(r => setTimeout(r, waitSeconds * 1000));
      
      // Retry once
      response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      });
      
      if (response.status === 429) {
        console.error('Rate limited again on second attempt. Skipping batch.');
        return null;
      }
    }

    if (!response.ok) {
      console.error('Gemini API batch error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Gemini finishReason (batch):', data.candidates?.[0]?.finishReason);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    console.log(`Raw Gemini response (batch):`, text);
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(clean);
      return Array.isArray(parsed) ? parsed : null;
    } catch (parseErr) {
      console.error(`Failed to parse batch JSON. Cleaned response:`, clean);
      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : null;
      }
      return null;
    }
  } catch (err) {
    console.error('Gemini batch classification error:', err);
    return null;
  }
}
