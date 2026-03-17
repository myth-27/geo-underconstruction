async function fetchSites() {
  try {
    const res = await fetch("http://localhost:3000/api/sites?area=Noida+Sector+137");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response length:", Array.isArray(data) ? data.length : data);
    if (Array.isArray(data) && data.length > 0) {
      console.log("First item:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Empty or invalid response:", data);
    }
  } catch (err) {
    console.error("Error fetching:", err);
  }
}
fetchSites();
