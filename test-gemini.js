async function listModels(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log('Models for key:', key.substring(0, 10));
  if (data.models) {
    data.models.forEach(m => console.log(m.name));
  } else {
    console.log(data);
  }
}

listModels(process.env.GEMINI_API_KEY);
