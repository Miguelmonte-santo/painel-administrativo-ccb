
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fnfybutkvsozbvvacomo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZnlidXRrdnNvemJ2dmFjb21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODQ4MDAsImV4cCI6MjA3NTk2MDgwMH0.aoGfgWoJxXFWsEMNZvBTnFxCbL6KbY2NaJQTkJ_3gEQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);