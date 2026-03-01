import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/USER/Desktop/TowMe/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: requests, error } = await supabase
    .from('towing_requests')
    .select('*')
    .in('status', ['pending', 'accepted', 'in_progress'])
    .limit(5);

  console.log('Active requests:', JSON.stringify(requests, null, 2));

  const { data: operators } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('role', 'tow_operator')
    .limit(5);

  console.log('\nOperators:', JSON.stringify(operators, null, 2));
}

check();
