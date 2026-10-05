import { createGame, rollForCurrentPlayer } from '#game/engine'
import type { GameState, PlayerColour, PlayerState } from '#game/types'

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export interface RoomPlayerRow {
  id: string
  room_id: string
  user_id: string
  display_name: string
  colour: PlayerColour
  seat: number
}

export interface RoomRow {
  id: string
  code: string
  host_user_id: string
  status: 'lobby' | 'active' | 'finished'
  game_state: GameState | null
  version: number
}

export function createRoomCode() {
  const bytes = new Uint32Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join('')
}

export function rollSecureDie() {
  const range = 2 ** 32
  const max = range - (range % 6)
  const value = new Uint32Array(1)
  do crypto.getRandomValues(value)
  while (value[0] >= max)
  return (value[0] % 6) + 1
}

export function gameFromRoomPlayers(players: RoomPlayerRow[]): GameState {
  const gamePlayers = players
    .sort((a, b) => a.seat - b.seat)
    .map<PlayerState>((player) => ({
      id: player.user_id,
      name: player.display_name,
      colour: player.colour,
      position: 1,
      skipTurns: 0
    }))
  return createGame(gamePlayers)
}

export function rollRoomGame(game: GameState, userId: string) {
  const currentPlayer = game.players[game.currentPlayerIndex]
  if (currentPlayer?.id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'It is not your turn.' })
  }
  const roll = rollSecureDie()
  return { roll, result: rollForCurrentPlayer(game, roll) }
}
