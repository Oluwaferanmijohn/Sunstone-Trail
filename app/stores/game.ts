import { defineStore } from 'pinia'
import { createGame, rollForCurrentPlayer } from '#game/engine'
import type { GameState, PlayerColour } from '#game/types'

interface NewPlayer {
  id: string
  name: string
  colour: PlayerColour
}

export const useGameStore = defineStore('game', () => {
  const game = ref<GameState | null>(null)

  function startLocalGame(players: NewPlayer[]) {
    game.value = createGame(players)
  }

  function applyLocalRoll(roll: number) {
    if (!game.value) throw new Error('Start a game before rolling.')
    const result = rollForCurrentPlayer(game.value, roll)
    game.value = result.state
    return result
  }

  function reset() {
    game.value = null
  }

  return { game, startLocalGame, applyLocalRoll, reset }
})
