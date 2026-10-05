<script setup lang="ts">
const roomApi = useRoomApi()
const displayName = ref('')
const roomCode = ref('')
const pending = ref<'create' | 'join' | null>(null)
const errorMessage = ref('')

async function createRoom() {
  if (!displayName.value.trim()) return
  pending.value = 'create'
  errorMessage.value = ''
  try {
    const { room } = await roomApi.create(displayName.value.trim())
    await navigateTo(`/room/${room.code}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.message ?? 'Could not create a room.'
  } finally { pending.value = null }
}

async function joinRoom() {
  if (!displayName.value.trim() || !roomCode.value.trim()) return
  pending.value = 'join'
  await navigateTo(`/room/${roomCode.value.trim().toUpperCase()}?join=1&name=${encodeURIComponent(displayName.value.trim())}`)
  pending.value = null
}
</script>

<template>
  <main class="min-h-screen bg-[#fff7e7] px-4 py-10 text-[#2b1b12] sm:py-16">
    <div class="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <section>
        <p class="mb-3 text-sm font-bold uppercase tracking-[.24em] text-[#a75d30]">Original online adventure board game</p>
        <h1 class="font-serif text-5xl font-black leading-none sm:text-7xl">Sunstone<br><span class="text-[#c96c34]">Trail</span></h1>
        <p class="mt-6 max-w-lg text-lg leading-8 text-[#654431]">Roll, race, discover shortcuts, and reach Sunstone Keep before your friends.</p>
      </section>
      <section class="rounded-[2rem] border-4 border-[#513121] bg-white p-6 shadow-[0_8px_0_#c4884f] sm:p-8">
        <label class="block text-sm font-black uppercase tracking-wider" for="display-name">Your explorer name</label>
        <input id="display-name" v-model="displayName" maxlength="24" placeholder="e.g. Ada" class="mt-2 w-full rounded-xl border-2 border-[#513121] bg-[#fffaf0] px-4 py-3 outline-none focus:ring-4 focus:ring-[#f5c44d]/60">
        <button class="mt-5 w-full rounded-xl bg-[#513121] px-4 py-3 font-black text-[#fff7df] disabled:opacity-50" :disabled="!displayName.trim() || pending !== null" @click="createRoom">{{ pending === 'create' ? 'Creating room…' : 'Create a private room' }}</button>
        <div class="my-6 flex items-center gap-3 text-sm font-bold text-[#9c765b]"><span class="h-px flex-1 bg-[#e6d2af]" />OR<span class="h-px flex-1 bg-[#e6d2af]" /></div>
        <label class="block text-sm font-black uppercase tracking-wider" for="room-code">Room code</label>
        <input id="room-code" v-model="roomCode" maxlength="6" placeholder="ABC123" class="mt-2 w-full rounded-xl border-2 border-[#513121] bg-[#fffaf0] px-4 py-3 font-mono uppercase tracking-[.3em] outline-none focus:ring-4 focus:ring-[#f5c44d]/60">
        <button class="mt-3 w-full rounded-xl border-2 border-[#513121] bg-[#f5c44d] px-4 py-3 font-black disabled:opacity-50" :disabled="!displayName.trim() || !roomCode.trim() || pending !== null" @click="joinRoom">Join room</button>
        <p v-if="errorMessage" class="mt-4 rounded-xl bg-[#ffe0d7] p-3 text-sm font-bold text-[#962d21]">{{ errorMessage }}</p>
      </section>
    </div>
  </main>
</template>
