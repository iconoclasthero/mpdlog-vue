<script setup>
import { toRefs, computed, watch, onMounted, onUnmounted, inject, watchEffect } from 'vue'
import { sec2sex } from '@/utils/time.js'

const debugRef = inject('componentDebug')

let debug = false
watchEffect(() => {
  if (debugRef.value) debug = true
  else debug = false
})

const emit = defineEmits(['action'])

const resultBus = inject('resultBus')

const props = defineProps({
  plRev: { type: Number, default: null },
  songs: { type: Array, required: true },
  songID: { type: Number, default: null },
  currentPosition: { type: Number, default: null },
  showPath: Boolean,
})

const { songs, songID, currentPosition, plRev } = toRefs(props)

if ( debug ) console.log('[DEBUG PlaylistAlbum] songID', songID)

if ( debug ) console.log('[DEBUG PlaylistAlbum] props.plRev', props.plRev)

const playSong = (pos) => {
  emit('action', { type: 'playPosition', pos })
}

const request = () => {
  console.log('[PlaylistAlbum] request entered')
  if ( debug ) console.log('[DEBUG PlaylistAlbum] Requesting playlist_album')
  emit('action', { type: 'playlist_album' })
}

const currentPos = computed(() => {
  const cur = songs.value.find(s => s.song_position >= 0 && s.song_position === s.song_position && s.isCurrent)
  return cur ? cur.song_position : null
})

// optional: watch for changes just to log updates
if ( debug && false) {
  watch(songs, (newVal) => console.log('[DEBUG PlaylistAlbum] songs updated', newVal), { deep: true })
  watch(currentPosition, (newVal) => console.log('[DEBUG PlaylistAlbum] currentPosition changed', newVal))
  watch(songID, (newVal) => { console.log('[DEBUG PlaylistAlbum] SongID changed', newVal), request() })
  watch(plRev, (newVal) => { console.log('[DEBUG PlaylistAlbum] plRev changed', newVal), request() })
}

if (debug) {
  watch(
    () => ({
      songs: songs.value,
      pos: currentPosition.value,
      id: songID.value,
      plRev: plRev.value,
    }),
    (v) => {
      console.log('[DEBUG PlaylistAlbum]', {
        songs: v.songs,
        plRev: v.plRev,
        pos: v.pos,
        id: v.id
      })
    },
    { deep: true }
  )
}


let off = null

onMounted(() => {
//  request()  // this must be done already in App.vue

  off = resultBus?.on('playlistChanged', () => {
    if ( debug ) console.log('[DEBUG PlaylistAlbum] playlistChanged → refreshing playlist_album')
    request()
  })
})

onUnmounted(() => {
  off && off()
})
</script>

<template>
  <div class="playlist-album">
    <hr style="background-color:#912715">

    <h5 class="pl-head" v-if="songs.length">
      Songs in playlist from
      <span class="album">{{ songs[0].album }}</span>:
    </h5>
   <div class="short-br"></div>
    <ul v-if="songs.length">
      <li v-for="song in songs" :key="song.song_position">
        <a href="#" @click.prevent="playSong(song.song_position)">
          <span :class="{ artist: song.song_position === currentPosition }">
            ({{ song.song_position }}) <strong>{{ song.artist }}</strong>
            –
            {{ String(song.disc).padStart(2,'0') }}-{{ String(song.track).padStart(2,'0') }}
            -
            {{ song.title }}
            [{{ sec2sex(song.time) }}]
          </span>
        </a>
            <div v-if="showPath" class="album file-path">
            <span style="text-decoration: none; display: inline-block;">
            <a :href="'mpdlog://open?path=' + encodeURIComponent(song.file)">
              {{ song.file }}
            </a></span>
            </div>
      </li>
    </ul>

    <div v-if="!songs.length">No songs available</div>
  </div>
</template>

<style scoped>
.current {
  color: #bea574;
  font-weight: bold;
}
.playlist-album ul {
  margin-left: 3em;
  padding-left: 0;
}
.short-br {
  display: block;
  height: 1px;
  margin: 0;
  padding: 0;
}
</style>
