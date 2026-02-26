import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL environment variable is required');
  return url;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error('SUPABASE_ANON_KEY environment variable is required');
    _supabase = createClient(getSupabaseUrl(), anonKey);
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    _supabaseAdmin = createClient(getSupabaseUrl(), serviceRoleKey);
  }
  return _supabaseAdmin;
}
