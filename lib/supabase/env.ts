const DEFAULT_SUPABASE_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDA0ODAwMDAsImV4cCI6MTkxNjA1NjAwMH0.placeholder';

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !url.includes('placeholder') && !!key && !key.includes('placeholder');
}

/**
 * Local demo mode (seeded personas, BroadcastChannel multi-tab sync) exists
 * only so the UI can be previewed without provisioning Supabase. It must
 * never be reachable in a production deployment: if NEXT_PUBLIC_SUPABASE_URL
 * is missing/placeholder there, that is a deploy misconfiguration, not an
 * invitation to silently run with authentication disabled.
 */
export function isDemoModeAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
