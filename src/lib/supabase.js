import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mttczwajebeuyomovzcm.supabase.co';

const supabaseKey = 'sb_publishable_3WeIoZd8CtcQa-tAF0nAFw_MnS4ZDGS';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

