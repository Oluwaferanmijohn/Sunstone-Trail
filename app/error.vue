<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-[#fff7e7] p-6 text-center text-[#2b1b12]">
    <section class="max-w-md rounded-[2rem] border-4 border-[#513121] bg-white p-8 shadow-[0_8px_0_#c4884f]">
      <p class="text-sm font-black uppercase tracking-[.2em] text-[#a75d30]">Trail interrupted</p>
      <h1 class="mt-3 text-5xl font-black">{{ error.statusCode ?? 500 }}</h1>
      <p class="mt-4 leading-7 text-[#654431]">{{ error.statusMessage || error.message || 'Something unexpected happened.' }}</p>
      <button class="mt-7 rounded-xl bg-[#513121] px-5 py-3 font-black text-[#fff7df]" @click="goHome">Return home</button>
    </section>
  </main>
</template>
