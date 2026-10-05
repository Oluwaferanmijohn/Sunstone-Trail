import { describe, expect, it } from 'vitest'
import { createGame, rollForCurrentPlayer } from '../shared/game/engine'

const players = [
  { id: 'ada', name: 'Ada', colour: 'blue' as const },
  { id: 'tobi', name: 'Tobi', colour: 'coral' as const }
]

describe('Sunstone Trail rules engine', () => {
  it('starts every player at Trailhead', () => {
    const game = createGame(players)
    expect(game.players.map((player) => player.position)).toEqual([1, 1])
    expect(game.currentPlayerIndex).toBe(0)
  })

  it('applies an advance tile without chaining another tile effect', () => {
    const game = createGame(players)
    const result = rollForCurrentPlayer(game, 5)
    expect(result.state.players[0].position).toBe(8)
    expect(result.events.map((event) => event.type)).toEqual(['moved', 'advanced'])
  })

  it('gives another roll when a player rolls a six', () => {
    const result = rollForCurrentPlayer(createGame(players), 6)
    expect(result.requiresAnotherRoll).toBe(true)
    expect(result.state.currentPlayerIndex).toBe(0)
  })

  it('makes a player miss their following turn after Evening Fog', () => {
    const game = createGame(players)
    game.players[0].position = 18
    const fogResult = rollForCurrentPlayer(game, 1)
    expect(fogResult.state.players[0].skipTurns).toBe(1)

    const otherPlayerResult = rollForCurrentPlayer(fogResult.state, 1)
    const skipped = rollForCurrentPlayer(otherPlayerResult.state, 4)
    expect(skipped.events).toEqual([{ type: 'skipped-turn' }])
    expect(skipped.state.players[0].skipTurns).toBe(0)
    expect(skipped.state.players[0].position).toBe(19)
  })

  it('requires an exact roll to reach Sunstone Keep', () => {
    const game = createGame(players)
    game.players[0].position = 34
    const result = rollForCurrentPlayer(game, 3)
    expect(result.state.players[0].position).toBe(34)
    expect(result.events[0]).toEqual({ type: 'overshot-finish', from: 34, roll: 3 })
  })

  it('declares the player reaching the keep as winner', () => {
    const game = createGame(players)
    game.players[0].position = 35
    const result = rollForCurrentPlayer(game, 1)
    expect(result.state.winnerId).toBe('ada')
    expect(result.events.at(-1)).toEqual({ type: 'won' })
  })
})
