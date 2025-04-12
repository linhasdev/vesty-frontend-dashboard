import { createClient } from '@supabase/supabase-js';

// Supabase configuration from your project
const supabaseUrl = 'https://rmryyhszigfrpjvthgbu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcnl5aHN6aWdmcnBqdnRoZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTA1NDEsImV4cCI6MjA1ODMyNjU0MX0.RoF_hYvEZ31M3y6aeHwTYbeADQheYBirkZWnDFvD4bc';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 