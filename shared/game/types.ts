export const PLAYER_COLOURS = ['blue', 'coral', 'gold', 'green'] as const

export type PlayerColour = (typeof PLAYER_COLOURS)[number]
export type TileEffect =
  | 'none'
  | 'advance'
  | 'retreat'
  | 'extra-roll'
  | 'skip-turn'
  | 'start'
  | 'finish'

export interface BoardTile {
  position: number
  effect: TileEffect
  destination?: number
  label: string
}

export interface PlayerState {
  id: string
  name: string
  colour: PlayerColour
  position: number
  skipTurns: number
}

export interface GameState {
  players: PlayerState[]
  currentPlayerIndex: number
  winnerId: string | null
  lastRoll: number | null
  turn: number
}

export type GameEvent =
  | { type: 'moved'; from: number; to: number }
  | { type: 'overshot-finish'; from: number; roll: number }
  | { type: 'advanced'; from: number; to: number; label: string }
  | { type: 'retreated'; from: number; to: number; label: string }
  | { type: 'extra-roll'; label: string }
  | { type: 'skip-turn-added'; label: string }
  | { type: 'skipped-turn' }
  | { type: 'won' }

export interface RollResult {
  state: GameState
  events: GameEvent[]
  requiresAnotherRoll: boolean
}
