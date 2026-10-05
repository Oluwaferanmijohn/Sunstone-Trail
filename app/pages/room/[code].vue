<script setup lang="ts">
import type { GameEvent, PlayerColour } from '#game/types'
import type { RoomSnapshot } from '../../composables/useRoomApi'

const route = useRoute()
const code = computed(() => String(route.params.code).toUpperCase())
const roomApi = useRoomApi()
const { ensureGuest, session } = useGuestIdentity()
const room = ref<RoomSnapshot | null>(null)
const colour = ref<PlayerColour>('coral')
const displayName = ref(String(route.query.name ?? ''))
const isJoining = ref(route.query.join === '1')
const loading = ref(true)
const pending = ref(false)
const message = ref('')
const errorMessage = ref('')
const availableColours: PlayerColour[] = ['coral', 'gold', 'green']

const isHost = computed(() => room.value?.hostUserId === session.value?.user.id)
const currentPlayer = computed(() => room.value?.gameState?.players[room.value.gameState.currentPlayerIndex])
const canRoll = computed(() => room.value?.status === 'active' && currentPlayer.value?.id === session.value?.user.id)
const roomRealtime = useRoomRealtime(code.value, () => { void loadRoom() })

async function loadRoom() {
  room.value = (await roomApi.get(code.value)).room
  isJoining.value = false
}

function describe(event: GameEvent, name: string) {
  if (event.type === 'advanced') return `${name} used ${event.label} and moved to ${event.to}.`
  if (event.type === 'retreated') return `${name} hit ${event.label} and fell back to ${event.to}.`
  if (event.type === 'skip-turn-added') return `${event.label}! ${name} misses the next turn.`
  if (event.type === 'extra-roll') return `${event.label}! ${name} rolls again.`
  if (event.type === 'skipped-turn') return `${name} misses this turn.`
  if (event.type === 'overshot-finish') return `${name} needs an exact roll to finish.`
  if (event.type === 'won') return `${name} reached Sunstone Keep and wins!`
  return ''
}

async function joinRoom() {
  pending.value = true
  errorMessage.value = ''
  try {
    await roomApi.join(code.value, displayName.value.trim(), colour.value)
    await loadRoom()
  } catch (error: any) { errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Could not join this room.' }
  finally { pending.value = false }
}

async function startGame() {
  if (!room.value) return
  pending.value = true
  try {
    room.value.gameState = (await roomApi.start(code.value)).game
    room.value.status = 'active'
    message.value = 'The trail is open. The blue explorer goes first.'
  } catch (error: any) { errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Could not start the game.' }
  finally { pending.value = false }
}

async function roll() {
  if (!room.value || !canRoll.value) return
  pending.value = true
  try {
    const player = currentPlayer.value!
    const response = await roomApi.roll(code.value)
    room.value.gameState = response.game
    room.value.status = response.game.winnerId ? 'finished' : 'active'
    const special = [...response.events].reverse().find((event) => event.type !== 'moved')
    message.value = special ? `Rolled ${response.roll}. ${describe(special, player.name)}` : `Rolled ${response.roll}.`
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Could not roll.'
    await loadRoom()
  } finally { pending.value = false }
}

onMounted(async () => {
  try {
    await ensureGuest()
    if (!isJoining.value) await loadRoom()
    await roomRealtime.connect(session.value!.access_token)
  } catch (error: any) {
    if (error?.statusCode === 403) isJoining.value = true
    else errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Could not open this room.'
  } finally { loading.value = false }
})
</script>

<template>
  <main class="min-h-screen bg-[#fff7e7] px-4 py-6 text-[#2b1b12] sm:p-8">
    <div class="mx-auto max-w-6xl">
      <NuxtLink to="/" class="text-sm font-bold text-[#8f542e]">← Leave room</NuxtLink>
      <div v-if="loading" class="grid min-h-[60vh] place-items-center font-bold">Preparing your adventure…</div>

      <section v-else-if="isJoining" class="mx-auto mt-16 max-w-md rounded-[2rem] border-4 border-[#513121] bg-white p-7 shadow-[0_8px_0_#c4884f]">
        <p class="text-sm font-black uppercase tracking-wider text-[#a75d30]">Join room {{ code }}</p>
        <h1 class="mt-2 text-3xl font-black">Choose your explorer</h1>
        <input v-model="displayName" maxlength="24" placeholder="Your name" class="mt-5 w-full rounded-xl border-2 border-[#513121] px-4 py-3 outline-none">
        <div class="mt-4 grid grid-cols-3 gap-2">
          <button v-for="item in availableColours" :key="item" class="rounded-xl border-2 px-3 py-2 font-bold capitalize" :class="colour === item ? 'border-[#513121] bg-[#f5c44d]' : 'border-[#d8c09b]'" @click="colour = item">{{ item }}</button>
        </div>
        <button class="mt-5 w-full rounded-xl bg-[#513121] px-4 py-3 font-black text-[#fff7df] disabled:opacity-50" :disabled="!displayName.trim() || pending" @click="joinRoom">{{ pending ? 'Joining…' : 'Join trail' }}</button>
      </section>

      <div v-else-if="room" class="mt-5">
        <header class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p class="text-sm font-bold uppercase tracking-wider text-[#8f542e]">Private room</p><h1 class="text-4xl font-black">{{ room.code }}</h1></div><span class="rounded-full px-4 py-2 text-sm font-black" :class="room.status === 'lobby' ? 'bg-[#f5c44d]' : 'bg-[#b9df8a]'">{{ room.status }}</span></header>

        <section v-if="room.status === 'lobby'" class="mx-auto max-w-xl rounded-[2rem] border-2 border-[#513121] bg-white p-7 text-center shadow-[0_6px_0_#e1c488]">
          <h2 class="text-3xl font-black">Waiting at the trailhead</h2><p class="mt-2 text-[#654431]">Share code <strong>{{ room.code }}</strong> with up to three friends.</p>
          <div class="my-6 grid gap-3 sm:grid-cols-2"><div v-for="player in room.players" :key="player.user_id" class="rounded-2xl bg-[#fff0cc] p-4 text-left font-black capitalize">{{ player.colour }} · {{ player.display_name }}</div></div>
          <button v-if="isHost" class="rounded-xl bg-[#513121] px-6 py-3 font-black text-[#fff7df] disabled:opacity-50" :disabled="room.players.length < 2 || pending" @click="startGame">{{ room.players.length < 2 ? 'Waiting for another explorer' : 'Start game' }}</button>
          <p v-else class="font-bold text-[#8f542e]">The host will start once everyone arrives.</p>
        </section>

        <div v-else-if="room.gameState" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <GameBoardGame :game="room.gameState" />
          <aside class="space-y-4"><section class="rounded-3xl border-2 border-[#513121] bg-white p-5"><p class="text-sm font-bold uppercase tracking-wider text-[#8f542e]">Now playing</p><h2 class="mt-1 text-2xl font-black">{{ room.gameState.winnerId ? 'Trail complete' : `${currentPlayer?.name}'s turn` }}</h2><p class="mt-3 min-h-10 text-sm leading-6 text-[#654431]">{{ message || 'Follow the trail to Sunstone Keep.' }}</p></section><section class="rounded-3xl bg-[#513121] p-5 text-[#fff7df]"><p class="text-sm font-bold uppercase tracking-wider text-[#f5c44d]">Last roll</p><div class="my-3 grid h-20 w-20 place-items-center rounded-2xl bg-[#fff7df] text-4xl font-black text-[#513121]">{{ room.gameState.lastRoll ?? '–' }}</div><button class="w-full rounded-xl bg-[#f5c44d] px-4 py-3 font-black text-[#2b1b12] disabled:opacity-50" :disabled="!canRoll || pending || Boolean(room.gameState.winnerId)" @click="roll">{{ pending ? 'Rolling…' : canRoll ? 'Roll dice' : 'Waiting for turn' }}</button></section></aside>
        </div>
        <p v-if="errorMessage" class="mx-auto mt-5 max-w-xl rounded-xl bg-[#ffe0d7] p-3 text-sm font-bold text-[#962d21]">{{ errorMessage }}</p>
      </div>
    </div>
  </main>
</template>
