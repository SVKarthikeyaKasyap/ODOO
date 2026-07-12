const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is missing in Backend/.env');
}

console.log("URL =", JSON.stringify(supabaseUrl));
console.log("KEY exists =", !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
