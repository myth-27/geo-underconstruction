async function testOtherKey() {
  const key = 'AIzaSyAyozF2jGzia5IvP_9IKO_5wWPMcKYrmtc';
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log('Result for AIzaSyAyoz...:');
    if (data.models) {
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}
testOtherKey();
