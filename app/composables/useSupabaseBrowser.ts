import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function useSupabaseBrowser() {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabasePublishableKey) {
    throw new Error('Supabase is not configured. Add the public keys to .env first.')
  }
  browserClient ??= createClient(config.public.supabaseUrl, config.public.supabasePublishableKey)
  return browserClient
}
