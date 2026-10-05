<script setup lang="ts">
import { BOARD } from '../../../shared/game/board'
import type { GameState, PlayerColour } from '../../../shared/game/types'

const props = defineProps<{ game: GameState }>()

const coordinates = [
  [12, 88], [22, 88], [32, 88], [42, 88], [52, 88], [62, 88],
  [72, 88], [82, 88], [88, 81], [88, 71], [88, 61], [88, 51],
  [80, 48], [70, 48], [60, 48], [50, 48], [40, 48], [30, 48],
  [20, 48], [12, 42], [12, 32], [20, 26], [30, 26], [40, 26],
  [50, 26], [60, 26], [70, 26], [79, 20], [72, 12], [62, 12],
  [52, 12], [42, 12], [32, 12], [22, 12], [14, 18], [12, 8]
] as const

const colourMap: Record<PlayerColour, string> = {
  blue: '#2f80ed',
  coral: '#ef6c5b',
  gold: '#edb83d',
  green: '#3b9b6d'
}

const effectClass: Record<string, string> = {
  none: 'tile--normal',
  start: 'tile--start',
  finish: 'tile--finish',
  advance: 'tile--advance',
  retreat: 'tile--retreat',
  'extra-roll': 'tile--extra',
  'skip-turn': 'tile--skip'
}

const points = coordinates.map(([x, y]) => `${x},${y}`).join(' ')

function coordinate(position: number) {
  const [x, y] = coordinates[position - 1]
  return { x, y }
}

function tokenOffset(playerIndex: number, playersAtTile: number) {
  if (playersAtTile === 1) return { x: 0, y: 0 }
  const angle = (Math.PI * 2 * playerIndex) / playersAtTile - Math.PI / 2
  return { x: Math.cos(angle) * 2.2, y: Math.sin(angle) * 2.2 }
}

function tileSymbol(effect: string) {
  return {
    start: 'S',
    finish: '★',
    advance: '↑',
    retreat: '↓',
    'extra-roll': '✦',
    'skip-turn': '⌛'
  }[effect] ?? ''
}
</script>

<template>
  <section class="board-shell" aria-label="Sunstone Trail game board">
    <svg class="board" viewBox="0 0 100 100" role="img" aria-label="The Sunstone Trail board from Trailhead to Sunstone Keep">
      <image href="/art/sunstone-trail-board-v1.png" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
      <polyline :points="points" fill="none" stroke="#fff8db" stroke-linecap="round" stroke-linejoin="round" stroke-width="7" opacity=".46" />
      <polyline :points="points" fill="none" stroke="#ad6939" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" opacity=".72" />

      <g v-for="tile in BOARD" :key="tile.position" :class="['tile', effectClass[tile.effect]]">
        <circle :cx="coordinate(tile.position).x" :cy="coordinate(tile.position).y" r="4.15" />
        <text v-if="tileSymbol(tile.effect)" class="tile-symbol" :x="coordinate(tile.position).x" :y="coordinate(tile.position).y - .7" text-anchor="middle">{{ tileSymbol(tile.effect) }}</text>
        <text :x="coordinate(tile.position).x" :y="coordinate(tile.position).y + 1.7" text-anchor="middle">{{ tile.position }}</text>
      </g>

      <g v-for="(player, index) in props.game.players" :key="player.id" :class="['token', { 'token--current': !props.game.winnerId && index === props.game.currentPlayerIndex }]">
        <circle
          :cx="coordinate(player.position).x + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).x"
          :cy="coordinate(player.position).y + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).y"
          r="2.3"
          :fill="colourMap[player.colour]"
        />
        <circle
          :cx="coordinate(player.position).x + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).x"
          :cy="coordinate(player.position).y + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).y"
          r="1.15"
          fill="none"
          stroke="#fff7df"
          stroke-width=".35"
        />
        <circle
          :cx="coordinate(player.position).x + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).x"
          :cy="coordinate(player.position).y + tokenOffset(index, props.game.players.filter((candidate) => candidate.position === player.position).length).y - .45"
          r=".55"
          fill="#fff7df"
        />
      </g>

      <text x="12" y="98" class="place-label">TRAILHEAD</text>
      <text x="12" y="4" class="place-label">SUNSTONE KEEP</text>
    </svg>
  </section>
</template>

<style scoped>
.board-shell {
  overflow: hidden;
  width: min(100%, 720px);
  aspect-ratio: 1;
  border: 8px solid #513121;
  border-radius: 1.5rem;
  box-shadow: 0 18px 0 #c4884f, 0 26px 42px rgb(66 35 17 / 28%);
}

.board { display: block; width: 100%; height: 100%; }
.tile circle { stroke: #513121; stroke-width: .7; }
.tile text { fill: #513121; font: 700 2.5px Inter, sans-serif; pointer-events: none; }
.tile .tile-symbol { font-size: 2.1px; font-weight: 900; }
.tile--normal circle { fill: #fff1c9; }
.tile--start circle { fill: #f5c44d; }
.tile--finish circle { fill: #f3ad38; stroke-width: 1; }
.tile--advance circle { fill: #b9df8a; }
.tile--retreat circle { fill: #ef9278; }
.tile--extra circle { fill: #9fcbeb; }
.tile--skip circle { fill: #bda8d9; }
.token { transform-box: fill-box; transform-origin: center; }
.token circle { stroke: #43291b; stroke-width: .55; transition: cx .45s ease, cy .45s ease; }
.token--current { animation: token-bob 1s ease-in-out infinite alternate; }
.place-label { fill: #fff7df; font: 800 2px Inter, sans-serif; letter-spacing: .25px; paint-order: stroke; stroke: #513121; stroke-width: .35px; }

@keyframes token-bob {
  to { transform: translateY(-1px); }
}

@media (prefers-reduced-motion: reduce) {
  .token--current { animation: none; }
  .token circle { transition: none; }
}
</style>
