import type { GameEvent, GameState, PlayerColour } from '../../shared/game/types'

export interface RoomPlayer {
  user_id: string
  display_name: string
  colour: PlayerColour
  seat: number
}

export interface RoomSnapshot {
  code: string
  hostUserId: string
  status: 'lobby' | 'active' | 'finished'
  gameState: GameState | null
  version: number
  players: RoomPlayer[]
}

export function useRoomApi() {
  const { ensureGuest } = useGuestIdentity()

  async function request<T>(url: string, options: Record<string, any> = {}) {
    const session = await ensureGuest()
    return $fetch<T>(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` }
    })
  }

  return {
    create: (displayName: string) => request<{ room: { code: string } }>('/api/rooms', { method: 'POST', body: { displayName } }),
    get: (code: string) => request<{ room: RoomSnapshot }>(`/api/rooms/${code}`),
    join: (code: string, displayName: string, colour: PlayerColour) => request(`/api/rooms/${code}/join`, { method: 'POST', body: { displayName, colour } }),
    start: (code: string) => request<{ game: GameState }>(`/api/rooms/${code}/start`, { method: 'POST' }),
    roll: (code: string) => request<{ roll: number; events: GameEvent[]; game: GameState }>(`/api/rooms/${code}/roll`, { method: 'POST' })
  }
}
