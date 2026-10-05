import type { RoomPlayerRow, RoomRow } from '../../../utils/rooms'
import { gameFromRoomPlayers } from '../../../utils/rooms'
import { requireSupabaseUser, supabaseAdmin } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const admin = supabaseAdmin()
  const { data: room } = await admin.from('game_rooms').select().eq('code', code).maybeSingle<RoomRow>()
  if (!room) throw createError({ statusCode: 404, statusMessage: 'This room does not exist.' })
  if (room.host_user_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'Only the host can start the game.' })
  if (room.status !== 'lobby') throw createError({ statusCode: 409, statusMessage: 'This game has already started.' })

  const { data: players } = await admin.from('game_room_players').select().eq('room_id', room.id).order('seat')
  if (!players || players.length < 2) throw createError({ statusCode: 409, statusMessage: 'At least two explorers are needed.' })
  const game = gameFromRoomPlayers(players as RoomPlayerRow[])

  const { error } = await admin.from('game_rooms').update({ status: 'active', game_state: game, version: room.version + 1 }).eq('id', room.id).eq('version', room.version)
  if (error) throw createError({ statusCode: 409, statusMessage: 'The room changed. Please try again.' })
  return { game }
})
