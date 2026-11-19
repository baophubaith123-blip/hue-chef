import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client seam of the online layer (Gói H9, mục 9.3).
 *
 * The dedicated free-tier "hue-chef" project is configured purely
 * through the gitignored `.env.local` (VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY — the publishable anon key only; the secret
 * key never ships in the client). When either value is missing the
 * game is simply offline: `getSupabase()` returns null and every
 * caller degrades to its local behaviour instead of failing.
 */

function readEnv(name: string): string {
  // vite-env.d.ts declares only the app name/version, and Node (unit
  // bundles) has no import.meta.env at all — read through unknown so
  // both environments compile and run.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const value = env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function isOnlineConfigured(): boolean {
  return readEnv('VITE_SUPABASE_URL') !== '' && readEnv('VITE_SUPABASE_ANON_KEY') !== '';
}

let cached: SupabaseClient | null = null;

/** Lazy singleton client, or null while the online layer is unconfigured. */
export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = readEnv('VITE_SUPABASE_URL');
  const key = readEnv('VITE_SUPABASE_ANON_KEY');
  if (url === '' || key === '') return null;
  cached = createClient(url, key);
  return cached;
}
