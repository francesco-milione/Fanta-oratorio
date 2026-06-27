import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iwitqearwcvggklhjbnl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QzzPwI6qm-57mEKuKQhF8Q_JhdAFaaO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
