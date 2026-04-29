<template>
  <div class="album-art-container">
    <!-- Desktop: unchanged -->
<!--
    <img
      v-if="albumArtData && !layout.narrow.value"
      :src="albumArtData"
      alt="Album Art"
      @click="$emit('refreshArt')"
      :style="{ maxWidth: deskWidth + 'px', height: 'auto' }"
    >

    <img
      v-if="albumArtData && !layout.narrow.value"
      :src="albumArtData"
      @click="handleClick"
      alt="Album Art"
      :style="{ maxWidth: deskWidth + 'px', height: 'auto' }"
    >

    <!-- Mobile: only show if layout.narrow -->
<!--
    <img
      v-else-if="albumArtData && layout.narrow.value"
      :src="albumArtData"
      alt="Album Art"
      @click="$emit('refreshArt')"
      :style="{ maxWidth: mobileMaxWidth, height: 'auto' }"
    >
-->

    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      @click="$emit('refreshArt')"
      :style="{ height: 'auto', maxWidth: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }"
    >

    <!-- Placeholder / fallback -->
<!--
    <div v-else-if="isLoading" class="musicdna-placeholder"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
      <p>Loading album art...</p>
    </div>

    <div v-else-if="isDead" class="musicdna-placeholder"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
      <img :src="deadSVGUrl" alt="Grateful Dead SVG" style="width: 100%; height: auto; filter: none !important;" />
    </div>

    <div v-else class="musicdna-placeholder"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
      <img src="../../assets/musicdna.svg" alt="MusicDNA" style="width: 100%; height: auto; fill: #000000 !important;" />
    </div>
-->

    <div v-else-if="isLoading" class="musicdna-placeholder"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
      <p>Loading album art...</p>
    </div>

    <img v-else-if="isDead" class="musicdna-placeholder"
         :src="deadSVGUrl"
         alt="Grateful Dead SVG"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">

    <img v-else class="musicdna-placeholder"
         src="../../assets/musicdna.svg"
         alt="MusicDNA"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
  </div>
  <hr />
</template>

<script setup>
import { ref, onMounted, inject, nextTick, watch, watchEffect } from 'vue'

const emit = defineEmits(['refreshArt'])

const props = defineProps({
  albumArtData: String,
  artist: String,
  mbArtistID: String
})

const handleClick = (ev) => {
  if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
    // Open in new tab if modifier key pressed
    const link = document.createElement('a')
    link.href = props.albumArtData
    link.target = '_blank'
    link.click()
  } else {
    // Normal click triggers refresh
    emit('refreshArt')
  }
}


// Only use layout for mobile
const layout = inject('layout', { narrow: false })
//const debugRef = inject('debug', false) // gets the reactive ref
//const debugRef = inject('debug') || ref(false) // gets the reactive ref
const debugRef = inject('componentDebug')

//let debug = false
//watchEffect(() => {
//  if (debugRef.value) debug = true
//  else debug = false
//})
const debug = true

if ( debug ) {
  watchEffect(() => {
    console.log('[DEBUG AlbumArt] PROPS LIVE:', props.artist, props.mbArtistID)
  })
}

if ( debug ) console.log('[DEBUG AlbumArt] ( • )( • )----ԅ(‾⌣‾ԅ)')
//setInterval(() => {
//  if (debugRef.value) {
//    console.log('[INTERVAL DEBUG]', debugRef.value)
//    debug = debugRef.value
//  }
//}, 10000)

const artFactor = 1.25
const maxWidth = ref(300)       // desktop fallback
const deskWidth = ref(maxWidth*artFactor)
const mobileMaxWidth = ref('200px') // mobile fallback
const isLoading = ref(false)
const isDead = ref(false)
const deadSVGUrl = ref(null)

if ( debug ) {
  console.log('[DEBUG AlbumArt] debug=', debug)
  console.log('[DEBUG AlbumArt] [PROPS INIT]', props.artist, props.mbArtistID)
  console.log('[DEBUG AlbumArt] [DEAD] outside onMounted', { isDead: isDead.value, deadSVGUrl: deadSVGUrl.value })
}

onMounted(() => {
  nextTick(() => {
    // Desktop sizing: measure .album.desktop
    const statusLine = document.querySelector('.album.desktop')
    if (statusLine) {
      maxWidth.value = statusLine.offsetWidth
      deskWidth.value = ( maxWidth.value * artFactor )
    }

    // Mobile sizing: measure .album.mobile if narrow
    if (layout.narrow.value) {
      const mobileStatus = document.querySelector('.album.mobile')
      if (mobileStatus) mobileMaxWidth.value = mobileStatus.offsetWidth + 'px'
    }
  })
})

// Grateful Dead fallback
watch([() => props.artist, () => props.mbArtistID], ([artist, mbid]) => {
  isDead.value = false
  if ( debug ) console.log('[DEBUG AlbumArt] watcher before if dead', { artist, mbid, isDead: isDead.value })
  if ((props.artist && props.artist.includes('Grateful Dead')) ||
      props.mbArtistID === '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6') {
//  if ((artist && artist.includes('Grateful Dead')) ||
//      mbid === '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6') {
    isDead.value = true
    if ( debug ) console.log('[DEBUG AlbumArt] watcher inside if dead', { artist, mbid, isDead: isDead.value })
    const modules = import.meta.glob('./dead/*.svg', { eager: true })
    const paths = Object.values(modules).map(m => m.default)
    if (paths.length > 0) deadSVGUrl.value = paths[Math.floor(Math.random() * paths.length)]
    if ( debug ) console.log('[DEBUG AlbumArt] [DEAD]', { isDead: isDead.value, deadSVGUrl: deadSVGUrl.value })
  }
}, { immediate: true })

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
  padding: 10px;
  margin: 5px 0;
}
</style>
