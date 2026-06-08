import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnvironment } from "./supabase-env";

/**
 * Client-side Supabase client.
 * Use this in client components (e.g., for auth, storage uploads).
 */
export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabasePublicEnvironment();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
