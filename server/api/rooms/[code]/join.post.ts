import type { PlayerColour } from '#game/types'
import type { RoomPlayerRow, RoomRow } from '../../../utils/rooms'
import { enforceRateLimit } from '../../../utils/rate-limit'
import { requireSupabaseUser, supabaseAdmin } from '../../../utils/supabase'

const colours: PlayerColour[] = ['blue', 'coral', 'gold', 'green']

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  enforceRateLimit('join-room', user.id, 10, 60_000)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const body = await readBody<{ displayName?: string; colour?: PlayerColour }>(event)
  const displayName = body.displayName?.trim()
  if (!code || !displayName || displayName.length > 24 || !colours.includes(body.colour ?? 'blue')) {
    throw createError({ statusCode: 400, statusMessage: 'Room details are invalid.' })
  }

  const admin = supabaseAdmin()
  const { data: room } = await admin.from('game_rooms').select().eq('code', code).maybeSingle<RoomRow>()
  if (!room) throw createError({ statusCode: 404, statusMessage: 'This room does not exist.' })
  if (room.status !== 'lobby') throw createError({ statusCode: 409, statusMessage: 'This game has already started.' })

  const { data: existing } = await admin.from('game_room_players').select().eq('room_id', room.id).eq('user_id', user.id).maybeSingle<RoomPlayerRow>()
  if (existing) return { room: { code: room.code, status: room.status }, player: existing }

  const { data: players, error: playersError } = await admin.from('game_room_players').select().eq('room_id', room.id).order('seat')
  if (playersError || !players) throw createError({ statusCode: 500, statusMessage: 'Could not load this room.' })
  if (players.length >= 4) throw createError({ statusCode: 409, statusMessage: 'This room is full.' })
  if (players.some((player) => player.colour === body.colour)) throw createError({ statusCode: 409, statusMessage: 'That explorer colour is taken.' })

  const { data: player, error } = await admin.from('game_room_players').insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    colour: body.colour,
    seat: players.length
  }).select().single<RoomPlayerRow>()
  if (error || !player) throw createError({ statusCode: 409, statusMessage: 'That seat is no longer available. Try again.' })

  await admin.from('game_rooms').update({ version: room.version + 1 }).eq('id', room.id).eq('version', room.version)

  return { room: { code: room.code, status: room.status }, player }
})
