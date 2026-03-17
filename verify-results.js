const fs = require('fs');

const logContent = fs.readFileSync('server.log', 'utf16le');
const lines = logContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Gemini API batch error') || lines[i].includes('Raw Gemini response (batch)') || lines[i].includes('Failed to parse batch JSON')) {
    console.log(lines[i].trim());
    for(let j=1; j<10; j++) {
      if (lines[i+j]) console.log(lines[i+j].trim());
    }
    console.log('---');
  }
}
