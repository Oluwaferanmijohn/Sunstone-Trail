import { createRoomCode, type RoomRow } from '../../utils/rooms'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireSupabaseUser, supabaseAdmin } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  enforceRateLimit('create-room', user.id, 5, 60_000)
  const body = await readBody<{ displayName?: string }>(event)
  const displayName = body.displayName?.trim()
  if (!displayName || displayName.length > 24) {
    throw createError({ statusCode: 400, statusMessage: 'Choose a display name between 1 and 24 characters.' })
  }

  const admin = supabaseAdmin()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createRoomCode()
    const { data: room, error } = await admin
      .from('game_rooms')
      .insert({ code, host_user_id: user.id })
      .select()
      .single<RoomRow>()

    if (error?.code === '23505') continue
    if (error || !room) throw createError({ statusCode: 500, statusMessage: 'Could not create a room.' })

    const { error: playerError } = await admin.from('game_room_players').insert({
      room_id: room.id,
      user_id: user.id,
      display_name: displayName,
      colour: 'blue',
      seat: 0
    })
    if (playerError) throw createError({ statusCode: 500, statusMessage: 'Could not add the host to the room.' })
    return { room: { code: room.code, status: room.status } }
  }

  throw createError({ statusCode: 503, statusMessage: 'Please try creating a room again.' })
})
