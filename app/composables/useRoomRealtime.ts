import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { GameState } from '#game/types'

interface RealtimeRoomRow {
  code: string
  status: 'lobby' | 'active' | 'finished'
  game_state: GameState | null
  version: number
}

export function useRoomRealtime(roomCode: string, onRoomChange: (room: RealtimeRoomRow) => void) {
  const config = useRuntimeConfig()
  let channel: RealtimeChannel | null = null

  async function connect(accessToken: string) {
    const client = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    })
    await client.realtime.setAuth(accessToken)
    channel = client
      .channel(`room:${roomCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `code=eq.${roomCode}`
      }, (payload) => onRoomChange(payload.new as RealtimeRoomRow))
      .subscribe()
  }

  function disconnect() {
    if (channel) channel.unsubscribe()
    channel = null
  }

  onUnmounted(disconnect)
  return { connect, disconnect }
}
