<template>
  <div class="playlist-album">
    <hr style="background-color:#912715">
    <h3 class="pl-head">Playlist @ current song:</h3>
    <ul>
      <li v-for="(albumGroup, aIndex) in groupedSongs" :key="aIndex" style="color:#cbc4b7">
        <strong class="bullet-1">{{ albumGroup.albumartist }} -- {{ albumGroup.album }}</strong>
        <ul>
          <li
            v-for="song in albumGroup.songs"
            :key="song.pos"
            :class="{ current: song.pos === currentPosition }"
          >
            <a href="#" @click.prevent="playSong(song.pos)" title="Play {{ song.pos }}">
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
  methods: { sec2sex },
  props: {
    songs: { type: Array, required: true },
    currentPosition: Number,
    playlistCurrentN: { type: Number, required: true }
  },

  emits: ['request-playlist-current', 'play-song', 'action'],
  setup(props, { emit }) {

    // Group songs by album for nested ULs
    const groupedSongs = computed(() => {
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

      return groups
    }) // <-- fixed closure here

    const request = () => {
      emit('action', {
        type: 'playlist_current',
        n: props.playlistCurrentN
      })
    }

    onMounted(request)

    watch(
      () => [props.currentPosition, props.playlistCurrentN],
      request
    )

    const playSong = (pos) => {
      emit('action', {
        type: 'pl_number',
        pos
      })
    }

    return { playSong, groupedSongs }
  }
}
</script>

<style scoped>
.current a {
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
</style>
