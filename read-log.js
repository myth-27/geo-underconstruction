const fs = require('fs');

const lines = fs.readFileSync('server.log', 'utf16le').split('\n');
let count = 0;
for (const line of lines) {
  if (line.includes('Tile fetched') || line.includes('Gemini finishReason') || line.includes('Classification result') || line.includes('Gemini API error') || line.includes('Raw Gemini response')) {
    console.log(line.trim());
    count++;
  }
  if (count > 20) break;
}
