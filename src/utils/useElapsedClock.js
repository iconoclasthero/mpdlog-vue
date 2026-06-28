import { ref } from "vue"

export function useElapsedClock() {
  const elapsed = ref(0)

  let timer = null

  let lastBackendElapsed = 0
  let lastBackendTime = Date.now()

  function syncFromBackend(v) {
    lastBackendElapsed = Number(v || 0)
    lastBackendTime = Date.now()
    elapsed.value = lastBackendElapsed
  }

  function start(durationRef) {
    if (timer) return

    timer = setInterval(() => {
      const now = Date.now()
      const delta = (now - lastBackendTime) / 1000

      const next = lastBackendElapsed + delta

      if (!durationRef || next <= durationRef.value + 1) {
        elapsed.value = next
      }
    }, 250)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    elapsed,
    syncFromBackend,
    start,
    stop
  }
}
