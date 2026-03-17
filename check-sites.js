const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sites found:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkSites();
