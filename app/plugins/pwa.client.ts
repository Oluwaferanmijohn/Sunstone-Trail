export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator) || import.meta.dev) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
})
