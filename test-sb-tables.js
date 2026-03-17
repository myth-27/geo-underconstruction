const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkhgfyozivwzlakybmtf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const p = await supabase.from('rera_projects').select('id').limit(1);
  console.log("rera_projects:", p.error || "exists");
  
  const s = await supabase.from('sites').select('id').limit(1);
  console.log("sites:", s.error || "exists");
}
check();
