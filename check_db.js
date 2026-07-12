const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fnhkgnbadrajrlpfjahv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d8cpzjZRblQcsmE4zyRX_g_1KOjFpVO';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    let { data, error } = await supabase.from('vehicle flow').select('*');
    console.log("vehicle flow:", data ? data.length + " rows" : error);
    
    ({ data, error } = await supabase.from('Vehicle Flow').select('*'));
    console.log("Vehicle Flow:", data ? data.length + " rows" : error);
    
    ({ data, error } = await supabase.from('Vehicle Registration').select('*'));
    console.log("Vehicle Registration:", data ? data.length + " rows" : error);
    
    if (data && data.length > 0) {
        console.log("Sample row:", data[0]);
    }
}
check();
