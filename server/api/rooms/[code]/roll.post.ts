import type { RoomRow } from '../../../utils/rooms'
import { enforceRateLimit } from '../../../utils/rate-limit'
import { rollRoomGame } from '../../../utils/rooms'
import { requireSupabaseUser, supabaseAdmin } from '../../../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  enforceRateLimit('roll-game', user.id, 30, 60_000)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const admin = supabaseAdmin()
  const { data: room } = await admin.from('game_rooms').select().eq('code', code).maybeSingle<RoomRow>()
  if (!room?.game_state || room.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This game is not active.' })
  }

  const { roll, result } = rollRoomGame(room.game_state, user.id)
  const status = result.state.winnerId ? 'finished' : 'active'
  const { error } = await admin
    .from('game_rooms')
    .update({ game_state: result.state, status, version: room.version + 1 })
    .eq('id', room.id)
    .eq('version', room.version)
  if (error) throw createError({ statusCode: 409, statusMessage: 'Another move was received first. The board has refreshed.' })

  return { roll, events: result.events, game: result.state, requiresAnotherRoll: result.requiresAnotherRoll }
})
