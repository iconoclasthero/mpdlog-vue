<template>
<!--  <hr style="background-color:#912715"> -->
  <div class="album-art-container">
    <svg style="display:none">
      <symbol id="binoculars-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-binoculars-fill" viewBox="0 0 16 16">
      <path d="M4.5 1A1.5 1.5 0 0 0 3 2.5V3h4v-.5A1.5 1.5 0 0 0 5.5 1zM7 4v1h2V4h4v.882a.5.5 0 0 0 .276.447l.895.447A1.5 1.5 0 0 1 15 7.118V13H9v-1.5a.5.5 0 0 1 .146-.354l.854-.853V9.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v.793l.854.853A.5.5 0 0 1 7 11.5V13H1V7.118a1.5 1.5 0 0 1 .83-1.342l.894-.447A.5.5 0 0 0 3 4.882V4zM1 14v.5A1.5 1.5 0 0 0 2.5 16h3A1.5 1.5 0 0 0 7 14.5V14zm8 0v.5a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5V14zm4-11H9v-.5A1.5 1.5 0 0 1 10.5 1h1A1.5 1.5 0 0 1 13 2.5z"/>
      </symbol>
    </svg>
    <!-- Desktop: unchanged -->

    <div v-if="albumArt.url" class="art-block">
      <img
        v-if="albumArt.url"
        :src="albumArt.url"
        alt="Album Art"
        @click="handleImageClick"
        :style="[imgStyle, isLowRes ? { border: '3px solid red', boxSizing: 'border-box' } : {}]"
        @load="checkSize"
      >

      <a
        v-if="albumArt.url"
        class="cover-search-button"
        :href="coverSearchURL"
        target="_blank"
        title="Search cover art"
      >
        <svg width="16" height="16">
          <use href="#binoculars-icon" />
        </svg>
      </a>
      <a
        href="#"
        class="cover-zoom-button"
        @click.prevent="zoomed = !zoomed"
        title="Zoom image"
      >🔍</a>

      <a
        href="#"
        class="fix-art-button"
        @click.prevent="$emit('action', 'fix_art')"
        title="Mark album art for fixing"
      >⚠</a>

      <button
        class="get-new-picture-button"
        type="button"
        @click="openNewPicture"
        title="Get new picture"
        aria-label="Get new picture"
        v-html="MAGNET_ICON"
      ></button>

    </div>
    <!-- Placeholder / fallback -->

    <div v-else-if="isLoading" class="art-block musicdna-placeholder"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
      <p>Loading album art...</p>
      <button
        class="get-new-picture-button"
        type="button"
        @click.stop="openNewPicture"
        title="Get new picture"
        aria-label="Get new picture"
        v-html="MAGNET_ICON"
      ></button>
    </div>

<!--    <img v-else-if="isDead" class="musicdna-placeholder"
         :src="deadSVGUrl"
         alt="Grateful Dead SVG"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }">
-->

    <div v-else-if="isDead" class="musicdna-placeholder">
      <img
         :src="deadSVGUrl"
         alt="Grateful Dead SVG"
         @click="$emit('refreshArt')"
         :style="{ width: layout.narrow.value ? mobileMaxWidth : deskWidth + 'px' }"
      >
      <a
        class="cover-search-button"
        :href="coverSearchURL"
        target="_blank"
        title="Search cover art"
      >
        <svg width="16" height="16">
          <use href="#binoculars-icon" />
        </svg>
      </a>
      <button
        class="get-new-picture-button"
        type="button"
        @click="openNewPicture"
        title="Get new picture"
        aria-label="Get new picture"
        v-html="MAGNET_ICON"
      ></button>
    </div>


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
        <svg width="16" height="16">
          <use href="#binoculars-icon" />
        </svg>
<!--        🔍 -->
      </a>
      <button
        class="get-new-picture-button"
        type="button"
        @click="openNewPicture"
        title="Get new picture"
        aria-label="Get new picture"
        v-html="MAGNET_ICON"
      ></button>
    </div>

    <div
      v-if="newPictureOpen"
      class="new-picture-overlay"
      @click.self="closeNewPicture"
    >
      <div
        class="new-picture-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-picture-title"
        @keydown.esc.stop.prevent="closeNewPicture"
      >
        <h3 id="new-picture-title">Get new picture</h3>
        <div class="new-picture-input-row">
          <input
            ref="newPictureInput"
            v-model="newPictureUrl"
            type="url"
            maxlength="512"
            placeholder="https://..."
            autocomplete="off"
            spellcheck="false"
            @paste="handleUrlPaste"
            @keydown.enter.prevent="replaceNewPicture"
          >
          <button
            v-if="newPictureUrl"
            type="button"
            class="new-picture-clear"
            title="Clear URL"
            aria-label="Clear URL"
            @click="clearNewPictureUrl"
          >×</button>
        </div>
        <p v-if="newPictureUrlError" class="new-picture-error">
          {{ newPictureUrlError }}
        </p>
        <div class="new-picture-actions">
          <button type="button" @click="closeNewPicture">Cancel</button>
          <button
            type="button"
            class="new-picture-fetch"
            :disabled="!newPictureUrl.trim() || !!newPictureUrlError"
            @click="replaceNewPicture"
          >
            <span v-html="MAGNET_ICON"></span>
            Fetch
          </button>
        </div>
      </div>
    </div>
  </div>
<!--  <hr v-if="!albumArtData" /> -->
<!-- <hr /> -->
</template>

<script setup>
import { ref, onMounted, inject, nextTick, watch, watchEffect, computed } from 'vue'

const emit = defineEmits(['refreshArt', 'action'])

// const hovered = ref(false)

const isLowRes = ref(false)

const props = defineProps({
  albumArt: Object,
//  albumArtData: String,
//  albumArtMeta: Object,
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

if ( debug ) console.log('imgStyle', imgStyle)
if ( debug ) console.log('props.current.file: ', props.current.file)
if ( debug ) console.log(props.albumArt)

const coverSearchURL = computed(() => {
  const coverSearchParams = new URLSearchParams({
    album: props.current.album?.replace(/ \(mp3\)\s*$/, ''),
    artist: props.current.albumartist
  });
  const coverSearchURL = 'https://covers.musichoarders.xyz?' + coverSearchParams.toString()
//  console.log('coverSearchURL', coverSearchURL)
  if ( debug ) console.log('coverSearchURL', coverSearchURL)
  return coverSearchURL
});

const MAGNET_ICON = `
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true">
    <path d="M11 0h5v4h-5V0z"/>
    <path d="M11 5v3c0 1.6-1.4 3-3 3S5 9.6 5 8V5H0v3c0 4.4 3.6 8 8 8s8-3.6 8-8V5h-5z"/>
    <path d="M0 0h5v4H0V0z"/>
  </svg>`

const newPictureOpen = ref(false)
const newPictureUrl = ref('')
const newPictureInput = ref(null)

let clipboardReadId = 0

const isArtworkUrl = (value) => {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  if (!/^file:/i.test(value)) return false

  try {
    const url = new URL(value)
    return url.protocol === 'file:' && !url.host && !!url.pathname
  } catch {
    return false
  }
}

const newPictureUrlError = computed(() => {
  const value = newPictureUrl.value.trim()
  if (!value) return ''
  if (value.length > 512) return 'URL cannot exceed 512 characters'
  if (!isArtworkUrl(value)) return 'Enter a valid HTTP(S) URL or file URI'
  return ''
})

const handleUrlPaste = (event) => {
  const value = event.clipboardData?.getData('text')?.trim() ?? ''

  event.preventDefault()

  if (value.length > 512 || !isArtworkUrl(value)) return

  newPictureUrl.value = value
}

const openNewPicture = async () => {
  const requestId = ++clipboardReadId
  newPictureUrl.value = ''
  newPictureOpen.value = true

  // Start clipboard access directly from the button click.
  let clipboardPromise
  try {
    if (navigator.clipboard?.readText) {
      clipboardPromise = navigator.clipboard.readText()
    }
  } catch {
    // Clipboard unavailable; manual paste remains possible.
  }

  await nextTick()
  newPictureInput.value?.focus()

  if (!clipboardPromise) return

  try {
    const clipboardText = (await clipboardPromise).trim()
    if (
      requestId !== clipboardReadId ||
      !newPictureOpen.value ||
      newPictureUrl.value
    ) return

    if (clipboardText.length <= 512 && isArtworkUrl(clipboardText)) {
      newPictureUrl.value = clipboardText
    }
  } catch {
    // Permission denied or clipboard unavailable.
  }
}

const clearNewPictureUrl = () => {
  ++clipboardReadId
  newPictureUrl.value = ''
  newPictureInput.value?.focus()
}

const closeNewPicture = () => {
  ++clipboardReadId
  newPictureOpen.value = false
  newPictureUrl.value = ''
}

const replaceNewPicture = () => {
  const value = newPictureUrl.value.trim()
  if (!value || newPictureUrlError.value) return

  const url = new URL(value)
  emit('action', {
    type: 'artwork_replace',
    url: url.protocol === 'file:' ? value : url.href
  })
  closeNewPicture()
}

const handleClick = (ev) => {
  if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
    // Open in new tab if modifier key pressed
    const link = document.createElement('a')
    link.href = props.albumArt.url
    link.target = '_blank'
    link.click()
  } else {
    // Normal click triggers refresh
    emit('refreshArt')
  }
}

const checkSize = (ev) => {
  const img = ev.target
  const width = props.albumArt?.meta?.response?.width
  const height = props.albumArt?.meta?.response?.height
  const isWebP = props.albumArt?.mime === 'image/webp'

//  isLowRes.value =
//    (img.naturalWidth < 1200 || img.naturalHeight < 1200) &&
//    !isWebP
//
//  console.log(
//    `[AlbumArt] Dimensions: %c${img.naturalWidth} × ${img.naturalHeight}%c\n\
//     ${props.current.artist} -- ${props.current.album}\n\
//     ${coverSearchURL.value}\n isLowRes: ${isLowRes.value}\n`,
//    'color: #b392f0; font-weight: bold;', // Style for the dimensions
//    'color: inherit; font-weight: normal;' // Reset style for the rest of the text
//  )

  isLowRes.value =
    (width < 1500 || height < 1500) &&
    !isWebP

  console.log(
    `[AlbumArt] Dimensions: %c${width} × ${height}%c\n\
     browser DOM: %c${img.naturalWidth} × ${img.naturalHeight}%c\n\
     ${props.current.artist} -- ${props.current.album}\n\
     ${coverSearchURL.value}\n isLowRes: ${isLowRes.value}\n`,
    'color: #b392f0; font-weight: bold;',
    'color: inherit; font-weight: normal;',
    'color: #b392f0; font-weight: bold;',
    'color: inherit; font-weight: normal;'
  )

  console.log(props.albumArt)

  if ( false && (
    img.naturalWidth <= 500 ||
    img.naturalHeight <= 500 )
  ) {
    console.log('[ART] below threshold')
    emit('action', 'fix_art')
//    emit('refreshArt')
  }
}

// Eventually replace checkSize with this watch to just look at the incoming metadata?
//watch(
//  () => props.albumArt,
//  (art) => {
//    if (!art?.meta?.response) return
//
//    isLowRes.value =
//      (art.meta.response.width < 1200 ||
//       art.meta.response.height < 1200) &&
//      art.mime !== 'image/webp'
//  },
//  { deep: true }
//)




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
  left: 6px;
  bottom: 6px;
  z-index: 10;
}

.fix-art-button {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 10;
}

.get-new-picture-button {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: #007bff;
  background: none;
  border: 0;
  cursor: pointer;
}

.get-new-picture-button svg {
  display: block;
  width: 16px;
  height: 16px;
  fill: currentColor;
}


.new-picture-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.65);
}

.new-picture-modal {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  color: var(--text-color, #eee);
  background: var(--background-color, #252525);
  border: 1px solid #666;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.new-picture-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-picture-input-row input {
  flex: 1;
  min-width: 0;
  padding: 9px;
}

.new-picture-clear {
  flex-shrink: 0;
  cursor: pointer;
}

.new-picture-error {
  color: #ff7777;
  font-size: 0.85em;
}

.new-picture-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.new-picture-actions button {
  padding: 7px 12px;
  cursor: pointer;
}

.new-picture-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.new-picture-fetch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.new-picture-fetch svg {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  fill: currentColor;
}

</style>
