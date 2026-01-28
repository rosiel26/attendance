import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gecidqdnnezymamgkcjv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlY2lkcWRubmV6eW1hbWdrY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjI0MjQsImV4cCI6MjA4NDUzODQyNH0.rh7sQb27DEoMJsQRy9ki5DO8zlb87HABwuZYQ9s9n9g';

if (!SUPABASE_ANON_KEY) {
  console.warn('Warning: Supabase anon key is not set. Please configure .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
