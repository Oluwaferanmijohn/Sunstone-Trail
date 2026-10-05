import type { RoomPlayerRow, RoomRow } from '../../../utils/rooms'
import { requireSupabaseUser, supabaseAdmin } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const admin = supabaseAdmin()
  const { data: room } = await admin.from('game_rooms').select().eq('code', code).maybeSingle<RoomRow>()
  if (!room) throw createError({ statusCode: 404, statusMessage: 'This room does not exist.' })
  const { data: players } = await admin.from('game_room_players').select().eq('room_id', room.id).order('seat')
  const membership = (players as RoomPlayerRow[] | null)?.some((player) => player.user_id === user.id)
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Join this room before viewing it.' })
  return { room: { code: room.code, hostUserId: room.host_user_id, status: room.status, gameState: room.game_state, version: room.version, players: players ?? [] } }
})
