const fetch = require('node-fetch') || globalThis.fetch;

async function testScan() {
  const url = 'http://localhost:3000/api/scan';
  const data = { areaName: 'Noida Sector 62' };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Read first few chunks just to trigger it and verify SSE
    let chunksRead = 0;
    while (true && chunksRead < 10) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      console.log('SSE Chunk:', text);
      chunksRead++;
    }

    // Close early so it doesn't take forever, though the backend will keep processing tiles since it's an async IIFE
    process.exit(0);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testScan();
