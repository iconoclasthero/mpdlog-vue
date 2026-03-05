<template>
  <div class="playlist-album">
    <hr style="background-color:#912715">
    <h3 class="pl-head">Playlist @ current song:</h3>
    <br>
    <ul>
      <li v-for="(albumGroup, aIndex) in groupedSongs" :key="aIndex" style="color:#cbc4b7">
        <strong class="bullet-1">{{ albumGroup.albumartist }} -- {{ albumGroup.album }}</strong>
        <ul>
<!--
          <li
            v-for="song in albumGroup.songs"
            :key="song.song_position"
            :class="{ current: song.song_position === currentPosition }"
          >
          -->
          <li
            v-for="song in albumGroup.songs"
            :key="song.songID"
            :class="{ current: song.songID === songID }"
          >
               <a href="#" @click.prevent="playSong(song.song_position)" :title="'Play ' + song.song_position">
              <strong>{{ song.artist }}</strong> – {{ song.disc }}-{{ song.track }} - {{ song.title }} [{{ sec2sex(song.time) }}]
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import { watch, onMounted, computed } from 'vue'
import { sec2sex } from '@/utils/time.js'

export default {
  name: 'PlaylistCurrent',
  props: {
    songs: { type: Array, required: true },
    currentPosition: Number,
    playlistCurrentN: { type: Number, required: true },
    songID: { type: Number, required: true }
  },
  emits: ['action'],

  setup(props, { emit }) {
    console.log('PlaylistCurrent setup fired', props)

    // Group songs by album
    const groupedSongs = computed(() => {
      console.log('Computing groupedSongs for', props.songs.length, 'songs')
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

      console.log('GroupedSongs computed:', groups)
      return groups
    })

    const request = () => {
      console.log('Requesting playlist_current n=', props.playlistCurrentN)
      emit('action', {
        type: 'playlist_current',
        n: props.playlistCurrentN
      })
    }

    onMounted(() => {
      console.log('PlaylistCurrent mounted')
      request()
    })

    watch(
      () => props.currentPosition,
      (newVal, oldVal) => {
        console.log('currentPosition changed from', oldVal, 'to', newVal)
        if (newVal !== oldVal) request()
      }
    )

    watch(
      () => props.songs,
      (newSongs, oldSongs) => {
        console.log('songs prop changed', oldSongs?.length, '->', newSongs?.length)
      },
      { deep: true }
    )

    watch(
      () => props.songID,
      (newID, oldID) => {
        console.log('songID changed from', oldID, 'to', newID)
        request()  // ask for new playlist_current JSON
      }
    )


    const playSong = (pos) => {
      console.log('playSong called with pos', pos)
      emit('action', { type: 'playPosition', pos })
    }

    return { playSong, groupedSongs, currentPosition: props.currentPosition, sec2sex }
  }
}
</script>

<style scoped>
.current a {
  font-weight: bold;
  text-decoration: underline;
  color: #bea574;
}
.bullet-1 {
  list-style-type: disc;
}
.playlist-album ul {
  margin-left: 1em;
  padding-left: 0;
}
</style>
