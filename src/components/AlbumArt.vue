<template>
<!--  <hr style="background-color:#912715"> -->
  <div class="album-art-container">
    <!-- Desktop: unchanged -->

<!--
    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      @click="$emit('refreshArt')"
      :style="{ height: 'auto', maxWidth: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }"
    >
-->
<div v-if="albumArtData" class="art-block">
<!--
    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      @click="$emit('refreshArt')"
      :style="imgStyle"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @load="checkSize"
    >
-->
    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      @click="handleImageClick"
      :style="imgStyle"
      @load="checkSize"
    >

    <a
      v-if="albumArtData"
      class="cover-search-button"
      :href="coverSearchURL"
      target="_blank"
      title="Search cover art"
    >
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-binoculars-fill" viewBox="0 0 16 16">
  <path d="M4.5 1A1.5 1.5 0 0 0 3 2.5V3h4v-.5A1.5 1.5 0 0 0 5.5 1zM7 4v1h2V4h4v.882a.5.5 0 0 0 .276.447l.895.447A1.5 1.5 0 0 1 15 7.118V13H9v-1.5a.5.5 0 0 1 .146-.354l.854-.853V9.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v.793l.854.853A.5.5 0 0 1 7 11.5V13H1V7.118a1.5 1.5 0 0 1 .83-1.342l.894-.447A.5.5 0 0 0 3 4.882V4zM1 14v.5A1.5 1.5 0 0 0 2.5 16h3A1.5 1.5 0 0 0 7 14.5V14zm8 0v.5a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5V14zm4-11H9v-.5A1.5 1.5 0 0 1 10.5 1h1A1.5 1.5 0 0 1 13 2.5z"/>
</svg>
    </a>
    <a href="#"
      class="cover-zoom-button"
      @click.prevent="zoomed = !zoomed"
      title="Zoom image"
    >🔍</a>


     <a href="#"
       v-if="albumArtData"
       class="fix-art-button"
       @click="$emit('action', 'fix_art')"
       title="Mark album art for fixing"
     >⚠</a>

</div>
    <!-- Placeholder / fallback -->

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

    <div v-else class="art-block">
      <img
        class="musicdna-placeholder"
        src="../../assets/musicdna.svg"
        alt="MusicDNA"
        @click="$emit('refreshArt')"
        :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }"
      >

      <a
        class="cover-search-button"
        :href="coverSearchURL"
        target="_blank"
        title="Search cover art"
      >
        🔍
      </a>
    </div>
  </div>
<!--  <hr v-if="!albumArtData" /> -->
<!-- <hr /> -->
</template>

<script setup>
import { ref, onMounted, inject, nextTick, watch, watchEffect, computed } from 'vue'

const emit = defineEmits(['refreshArt', 'action'])

// const hovered = ref(false)

const props = defineProps({
  albumArtData: String,
  artist: String,
  mbArtistID: String,
  current: Object
})

const debugRef = inject('componentDebug')

let debug = false
watchEffect(() => {
  if (debugRef.value) debug = true
  else debug = false
})

//const imgStyle = computed(() => ({
//  height: 'auto',
//  maxWidth: hovered.value
//    ? undefined
//    : (layout.narrow.value ? mobileMaxWidth.value : deskWidth.value + 'px')
//}))

const zoomed = ref(false)

const imgStyle = computed(() => ({
  height: 'auto',
  maxWidth: zoomed.value
    ? undefined
    : (layout.narrow.value ? mobileMaxWidth.value : deskWidth.value + 'px')
}))

if (debug) console.log('imgStyle', imgStyle)
if (debug) console.log('props.current.file: ', props.current.file)
const coverSearchURL = computed(() => {
  const coverSearchParams = new URLSearchParams({
    album: props.current.album?.replace(/ \(mp3\)\s*$/, ''),
    artist: props.current.albumartist
  });
  const coverSearchURL = 'https://covers.musichoarders.xyz?' + coverSearchParams.toString()
//  console.log('coverSearchURL', coverSearchURL)
  if (debug) console.log('coverSearchURL', coverSearchURL)
  return coverSearchURL
});

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

const checkSize = (ev) => {
  const img = ev.target

  console.log(
    '[ART]',
    img.naturalWidth,
    'x',
    img.naturalHeight
  )

  if ( false && (
    img.naturalWidth <= 500 ||
    img.naturalHeight <= 500 )
  ) {
    console.log('[ART] below threshold')
    emit('action', 'fix_art')
//    emit('refreshArt')
  }
}


// Only use layout for mobile
const layout = inject('layout', { narrow: false })
//const debugRef = inject('debug', false) // gets the reactive ref
//const debugRef = inject('debug') || ref(false) // gets the reactive ref

//watchEffect(() => {
//  console.log('hovered:', hovered.value)
//})

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

const handleImageClick = (ev) => {
  if (ev.ctrlKey || ev.metaKey) {
    zoomed.value = !zoomed.value
    return
  }

  emit('refreshArt')
}

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
    isDead.value = true
    if ( debug ) console.log('[DEBUG AlbumArt] watcher inside if dead', { artist, mbid, isDead: isDead.value })
    const modules = import.meta.glob('./dead/*.svg', { eager: true })  /**/

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

.art-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}


.art-block {
  position: relative;
  display: block;
  margin-bottom: 8px; /* THIS replaces hr spacing */
}

.art-block {
  position: relative;
  display: inline-block; /* key change */
}

.art-img {
  display: block;
}
.art-img {
  display: block;
  width: auto;
  max-width: 100%;
}

.cover-search-button {
  position: absolute;
  top: 4px;
  right: 4px;

  z-index: 10;
  text-decoration: none;

  font-size: 14px;
  line-height: 1;
}

.cover-zoom-button {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 10;
}

.fix-art-button {
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 10;
}

</style>
