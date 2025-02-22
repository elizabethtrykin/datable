import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  created_at: string;
  twitter_handle: string;
  linkedin_url: string | null;
  personal_website: string | null;
  other_links: string[] | null;
  twitter_data: {
    text: string;
  } | null;
  linkedin_data: any | null;
  website_data: {
    text: string;
  } | null;
  other_links_data: any[] | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  last_updated: string;
}; 