import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client with public access
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
