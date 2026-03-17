const key = process.env.GOOGLE_GEOCODING_API_KEY;
const address = encodeURIComponent('Noida Sector 62');
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${key}`;

async function test() {
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
