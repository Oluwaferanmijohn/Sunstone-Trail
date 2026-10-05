import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

function config() {
  const runtime = useRuntimeConfig()
  if (!runtime.public.supabaseUrl || !runtime.public.supabasePublishableKey || !runtime.supabaseServiceRoleKey) {
    throw createError({ statusCode: 503, statusMessage: 'Supabase is not configured yet.' })
  }
  return runtime
}

export function supabaseAdmin() {
  const runtime = config()
  return createClient(runtime.public.supabaseUrl, runtime.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function requireSupabaseUser(event: H3Event) {
  const authorization = getHeader(event, 'authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Sign in is required.' })

  const runtime = config()
  const client = createClient(runtime.public.supabaseUrl, runtime.public.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'Your session is invalid.' })
  return data.user
}
