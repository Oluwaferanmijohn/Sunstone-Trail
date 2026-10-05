import type { BoardTile } from '#game/types'

export const FINISH_POSITION = 36

const specialTiles: Record<number, Omit<BoardTile, 'position'>> = {
  1: { effect: 'start', label: 'Trailhead' },
  6: { effect: 'advance', destination: 8, label: 'Lantern Find' },
  9: { effect: 'retreat', destination: 6, label: 'Loose Stones' },
  12: { effect: 'advance', destination: 17, label: 'River Ferry' },
  16: { effect: 'extra-roll', label: 'Market Luck' },
  19: { effect: 'skip-turn', label: 'Evening Fog' },
  22: { effect: 'advance', destination: 25, label: 'Hornbill Guide' },
  26: { effect: 'retreat', destination: 21, label: 'Wrong Trail' },
  29: { effect: 'advance', destination: 32, label: 'Rope Bridge' },
  32: { effect: 'retreat', destination: 27, label: 'Rockslide' },
  34: { effect: 'advance', destination: 36, label: 'Sunrise Path' },
  36: { effect: 'finish', label: 'Sunstone Keep' }
}

export const BOARD: readonly BoardTile[] = Array.from(
  { length: FINISH_POSITION },
  (_, index) => {
    const position = index + 1
    return {
      position,
      effect: 'none' as const,
      label: `Trail ${position}`,
      ...specialTiles[position]
    }
  }
)

export function tileAt(position: number): BoardTile {
  const tile = BOARD[position - 1]
  if (!tile) throw new Error(`No board tile exists at position ${position}.`)
  return tile
}
