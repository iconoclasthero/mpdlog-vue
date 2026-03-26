<template>
  <div class="album-art-container">
    <!-- Desktop: unchanged -->
    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      :style="{ maxWidth: `calc(${maxWidth} * 1.2)`, height: 'auto' }"
    >

    <!-- Mobile: only show if layout.narrow -->
    <img
      v-if="albumArtData && layout.narrow"
      :src="albumArtData"
      alt="Album Art"
      :style="{ maxWidth: mobileMaxWidth, height: 'auto' }"
    >

    <!-- Placeholder / fallback -->
    <div v-else-if="isLoading" class="musicdna-placeholder"
         :style="{ width: layout.narrow ? mobileMaxWidth : maxWidth }">
      <p>Loading album art...</p>
    </div>

    <div v-else-if="isDead" class="musicdna-placeholder"
         :style="{ width: layout.narrow ? mobileMaxWidth : maxWidth }">
      <img :src="deadSVGUrl" alt="Grateful Dead SVG" style="width: 100%; height: auto;" />
    </div>

    <div v-else class="musicdna-placeholder"
         :style="{ width: layout.narrow ? mobileMaxWidth : maxWidth }">
      <img src="../../assets/musicdna.svg" alt="MusicDNA" style="width: 100%; height: auto;" />
    </div>
  </div>
  <hr />
</template>

<script setup>
import { ref, onMounted, inject, nextTick } from 'vue'

const props = defineProps({
  albumArtData: String,
  artist: String,
  mbArtistID: String
})

// Only use layout for mobile
const layout = inject('layout', { narrow: false })

const maxWidth = ref('300px')       // desktop fallback
const mobileMaxWidth = ref('200px') // mobile fallback
const isLoading = ref(false)
const isDead = ref(false)
const deadSVGUrl = ref(null)

onMounted(() => {
  nextTick(() => {
    // Desktop sizing: measure .album.desktop
    const statusLine = document.querySelector('.album.desktop')
    if (statusLine) maxWidth.value = statusLine.offsetWidth + 'px'

    // Mobile sizing: measure .album.mobile if narrow
    if (layout.narrow) {
      const mobileStatus = document.querySelector('.album.mobile')
      if (mobileStatus) mobileMaxWidth.value = mobileStatus.offsetWidth + 'px'
    }
  })

  // Grateful Dead fallback
  if ((props.artist && props.artist.includes('Grateful Dead')) ||
      props.mbArtistID === '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6') {
    isDead.value = true
    const modules = import.meta.glob('./dead/*.svg', { eager: true })
    const paths = Object.values(modules).map(m => m.default)
    if (paths.length > 0) deadSVGUrl.value = paths[Math.floor(Math.random() * paths.length)]
  }
})
</script>

<style scoped>
.album-art-container {
  margin: 0;
  padding: 0;
}

.album-art-container img {
  display: block;
  margin: 0;
}

.musicdna-placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  color: gray;
  font-size: 0.9em;
  text-align: left;
  border: 1px dashed #ccc;
  padding: 10px;
  margin: 5px 0;
}
</style>
