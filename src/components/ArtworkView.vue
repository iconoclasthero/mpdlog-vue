<template>
  <div class="artwork-root">
<!--    <ArtworkGrid
      :candidates="candidates"
      :selectedId="selectedId"
      @select="selectedId = $event"
    />

    <ArtworkSidebar
      :candidate="selectedCandidate"
    />
-->
<hr style="background-color:#912715">
Path = {{ props.path }}
<pre v-if="artwork">
{{ JSON.stringify(artwork, null, 2) }}
</pre>

  </div>
</template>

<script setup>
import { inject, ref, computed, watch, onMounted } from 'vue'
//import ArtworkGrid from '../components/artwork/ArtworkGrid.vue'
//import ArtworkSidebar from '../components/artwork/ArtworkSidebar.vue'

const cmdBus = inject('cmdBus')
const resultBus = inject('resultBus')
const isConnected = inject('isConnected')

const props = defineProps({
  player: Object,
  current: Object,
  next: Object,
  showPath: Boolean,
  path: String,
})

const artwork = ref(null)

resultBus.on('artwork', (msg) => {
  console.log('[ArtworkView]', msg)
  artwork.value = msg
})

const selectedId = ref(null)

const candidates = ref([])

const selectedCandidate = computed(() =>
  candidates.value.find(c => c.id === selectedId.value)
)

// --- send request function ---
function requestArtwork(path) {
  console.log("requestArtwork(path): ", cmdBus, isConnected.value, path)
  if (!cmdBus) return
  if (!isConnected?.value) return
  if (!path) return

  cmdBus.send({
    system: "artwork",
    cmd: "resolve",
    args: { path }
  })

  console.log("cmdBus.send system", "artwork", "cmd", "resolve", "args", path)

}

// --- run once on mount ---
onMounted(() => {
  requestArtwork(props.path)
})

// --- re-run when path changes ---
watch(
  () => props.path,
  (newPath, oldPath) => {
    if (newPath && newPath !== oldPath) {
      requestArtwork(newPath)
    }
  }
)



</script>
