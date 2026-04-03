<template>
  <div class="playlist-album">
    <hr style="background-color:#912715">
    <h3 class="pl-head">Playlist @ current song:</h3>
    <br>
    <ul>
      <li v-for="(albumGroup, aIndex) in groupedSongs" :key="aIndex" style="color:#cbc4b7">
        <strong class="bullet-1">{{ albumGroup.albumartist }} -- {{ albumGroup.album }}</strong>
        <ul>
          <li v-for="song in albumGroup.songs" :key="song.songID" :class="{ 'artist current': song.songID === songID }">
            <a href="#" @click.prevent="playSong(song.song_position)" :title="'Play ' + song.song_position">
              <strong>({{ String(song.song_position).padStart(
                          Math.max(...songs.map(s => String(s.song_position).length)), '0' ) }}) {{ song.artist }}
              </strong> – {{ String(song.disc).padStart(2,'0') }}-{{ String(song.track).padStart(2,'0') }}
                        - {{ song.title }} [{{ sec2sex(song.time) }}]
            </a>
<!--
            <div v-if="showPath" class="album file-path">
            <span style="text-decoration: none; display: inline-block;">{{ song.file }}</span>
            </div>
-->
            <div v-if="showPath" class="album file-path">
            <span style="text-decoration: none; display: inline-block;">
            <a :href="'mpdlog://open?path=' + encodeURIComponent(song.file)">
              {{ song.file }}
            </a></span>
            </div>

          </li>
        <div v-if="showPath" class="medium-br"><br></div>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import { watch, watchEffect, onMounted, onUnmounted, computed, inject } from 'vue'
import { sec2sex } from '@/utils/time.js'

export default {
  name: 'PlaylistCurrent',
  props: {
    songs: { type: Array, required: true },
    currentPosition: Number,
    songID: { type: Number, required: true },
    playlistCurrentN: { type: Number, required: true },
    showPath: Boolean
  },
  emits: ['action'],

  setup(props, { emit }) {
    const debugRef = inject('componentDebug')
    let debug = false
    watchEffect(() => {
      if (debugRef.value) debug = true
      else debug = false
    })

    if ( debug ) console.log('[DEBUG PlaylistCurrent] setup fired', props)

    const resultBus = inject('resultBus')

    // Group songs by album
    const groupedSongs = computed(() => {
       if ( debug ) console.log('[DEBUG PlaylistCurrent] Computing groupedSongs for', props.songs.length, 'songs')
      const groups = []
      let lastAlbum = null
      let currentGroup = null

      props.songs.forEach(song => {
        if (song.album !== lastAlbum) {
          currentGroup = { album: song.album, albumartist: song.albumartist, songs: [] }
          groups.push(currentGroup)
          lastAlbum = song.album
        }
        currentGroup.songs.push(song)
      })

       if ( debug ) console.log('[DEBUG PlaylistCurrent] GroupedSongs computed:', groups)
      return groups
    })

    const request = () => {
       if ( debug ) console.log('[DEBUG PlaylistCurrent] Requesting playlist_current n=', props.playlistCurrentN)
      emit('action', {
        type: 'playlist_current',
        n: props.playlistCurrentN
      })
    }

    onMounted(() => {
       if ( debug ) console.log('[DEBUG PlaylistCurrent] Mounted')
      request()

      resultBus?.on('playlistChanged', () => {
         if ( debug ) console.log('[DEBUG PlaylistCurrent] playlistChanged → refreshing playlist_current')
        request()
      })
    })

    // maybe need later?  keep uncommented f/now?
    const off = resultBus.on('playlistChanged', () => {
      request()
    })

    onUnmounted(() => off())

    watch(
      () => props.currentPosition,
      (newVal, oldVal) => {
         if ( debug ) console.log('[DEBUG PlaylistCurrent] currentPosition changed from', oldVal, 'to', newVal)
        if (newVal !== oldVal) request()
      }
    )

    watch(
      () => props.songs,
      (newSongs, oldSongs) => {
         if ( debug ) console.log('[DEBUG PlaylistCurrent] songs prop changed', oldSongs?.length, '->', newSongs?.length)
      },
      { deep: true }
    )

    watch(
      () => props.songID,
      (newID, oldID) => {
         if ( debug ) console.log('[DEBUG PlaylistCurrent] songID changed from', oldID, 'to', newID)
        request()  // ask for new playlist_current JSON
      }
    )


    const playSong = (pos) => {
       if ( debug ) console.log('[DEBUG PlaylistCurrent] playSong called with pos', pos)
      emit('action', { type: 'playPosition', pos })
    }

    return { playSong, groupedSongs, currentPosition: props.currentPosition, sec2sex }
  }
}
</script>

<style scoped>
.artist.current {
  font-weight: bold;
  text-decoration: underline;
}
.bullet-1 {
  list-style-type: disc;
}
.playlist-album ul {
  margin-left: 1em;
  padding-left: 0;
}
.album.file-path {
  text-decoration: unset !important;
  font-weight: normal;
  font-size: 0.9em;
  line-height: 1.0em;
  margin: 0;
  padding: 0;
}
</style>
