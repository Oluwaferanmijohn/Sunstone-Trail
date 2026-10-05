import { FINISH_POSITION, tileAt } from './board'
import type { GameEvent, GameState, PlayerState, RollResult } from './types'

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player }))
  }
}

function nextPlayerIndex(state: GameState, from: number): number {
  return (from + 1) % state.players.length
}

export function createGame(players: Omit<PlayerState, 'position' | 'skipTurns'>[]): GameState {
  if (players.length < 2 || players.length > 4) {
    throw new Error('Sunstone Trail needs between 2 and 4 players.')
  }

  const ids = new Set(players.map((player) => player.id))
  if (ids.size !== players.length) throw new Error('Every player must have a unique id.')

  return {
    players: players.map((player) => ({ ...player, position: 1, skipTurns: 0 })),
    currentPlayerIndex: 0,
    winnerId: null,
    lastRoll: null,
    turn: 1
  }
}

export function rollForCurrentPlayer(state: GameState, roll: number): RollResult {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) {
    throw new Error('A die roll must be an integer from 1 to 6.')
  }
  if (state.winnerId) throw new Error('This game has already ended.')

  const next = cloneState(state)
  const player = next.players[next.currentPlayerIndex]
  const events: GameEvent[] = []
  next.lastRoll = roll

  if (player.skipTurns > 0) {
    player.skipTurns -= 1
    events.push({ type: 'skipped-turn' })
    next.currentPlayerIndex = nextPlayerIndex(next, next.currentPlayerIndex)
    next.turn += 1
    return { state: next, events, requiresAnotherRoll: false }
  }

  const destination = player.position + roll
  if (destination > FINISH_POSITION) {
    events.push({ type: 'overshot-finish', from: player.position, roll })
    next.currentPlayerIndex = nextPlayerIndex(next, next.currentPlayerIndex)
    next.turn += 1
    return { state: next, events, requiresAnotherRoll: false }
  }

  const from = player.position
  player.position = destination
  events.push({ type: 'moved', from, to: destination })

  const tile = tileAt(destination)
  if (tile.effect === 'advance' && tile.destination) {
    player.position = tile.destination
    events.push({ type: 'advanced', from: destination, to: tile.destination, label: tile.label })
  }
  if (tile.effect === 'retreat' && tile.destination) {
    player.position = tile.destination
    events.push({ type: 'retreated', from: destination, to: tile.destination, label: tile.label })
  }
  if (tile.effect === 'skip-turn') {
    player.skipTurns += 1
    events.push({ type: 'skip-turn-added', label: tile.label })
  }
  if (tile.effect === 'finish') {
    next.winnerId = player.id
    events.push({ type: 'won' })
    return { state: next, events, requiresAnotherRoll: false }
  }

  const requiresAnotherRoll = tile.effect === 'extra-roll' || roll === 6
  if (requiresAnotherRoll) {
    if (tile.effect === 'extra-roll') events.push({ type: 'extra-roll', label: tile.label })
    return { state: next, events, requiresAnotherRoll: true }
  }

  next.currentPlayerIndex = nextPlayerIndex(next, next.currentPlayerIndex)
  next.turn += 1
  return { state: next, events, requiresAnotherRoll: false }
}
