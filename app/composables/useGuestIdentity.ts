import type { Session } from '@supabase/supabase-js'

export function useGuestIdentity() {
  const session = useState<Session | null>('guest-session', () => null)

  async function ensureGuest() {
    const supabase = useSupabaseBrowser()
    const { data: current, error: currentError } = await supabase.auth.getSession()
    if (currentError) throw currentError
    if (current.session) {
      session.value = current.session
      return current.session
    }
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.session) throw error ?? new Error('Could not start a guest session.')
    session.value = data.session
    return data.session
  }

  return { session, ensureGuest }
}
