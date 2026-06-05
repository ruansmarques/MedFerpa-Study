import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqqjfjhwsrlgntgnojxj.supabase.co';
const supabaseAnonKey = 'sb_publishable_NHlxLpX4EtVNqN3spfpEBA_FONMLPFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
