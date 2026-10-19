import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://dqqjfjhwsrlgntgnojxj.supabase.co';
export const supabaseAnonKey = 'sb_publishable_NHlxLpX4EtVNqN3spfpEBA_FONMLPFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
