<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { sec2sex } from '@/utils/time.js'

//  const emit = defineEmits(['playPosition'])
  const emit = defineEmits(['action'])

  const props = defineProps({
    albumkey: { type: String, default: null },
    currentPosition: { type: Number, default: null }
  })

  const songs = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function fetchAlbum() {
    loading.value = true
    error.value = null

    const payload = props.albumkey
      ? { system: 'mpd', cmd: 'playlist', args: { albumkey: props.albumkey } }
      : { system: 'mpd', cmd: 'playlist', args: 'album' }

    try {
      const ws = new WebSocket('ws://192.168.1.2:8008/ws')

      ws.onopen = () => {
        ws.send(JSON.stringify(payload))
      }

      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data)
        songs.value = data.response || []
        loading.value = false
        ws.close()
      }

      ws.onerror = (e) => {
        error.value = 'WebSocket error'
        loading.value = false
      }

    } catch (e) {
      error.value = e.message
      loading.value = false
    }
  }

//  function playSong(pos) {
//    const payload = {
//      system: 'mpd',
//      cmd: 'play',
//      args: { song_position: pos }
//    }
//
//    const ws = new WebSocket('ws://192.168.1.2:8008/ws')
//    ws.onopen = () => ws.send(JSON.stringify(payload))
//  }

  const playSong = (pos) => {
    console.log('playSong called with pos', pos)
    emit('action', { type: 'playPosition', pos })
  }


  watch(
    () => props.currentPosition,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        fetchAlbum()
      }
    }
  )

  const currentPos = computed(() => {
    const cur = songs.value.find(s => s.song_position >= 0 && s.song_position === s.song_position && s.isCurrent)
    return cur ? cur.song_position : null
  })

  onMounted(fetchAlbum)
</script>


<template>
  <div class="playlist-album">
  <hr style="background-color:#912715">

    <h3 v-if="songs.length">
      Songs in playlist from
      <em class="album">
        {{ songs[0].album }}
      </em>
    </h3>

    <div v-if="loading">Loading…</div>
    <div v-if="error">{{ error }}</div>

    <ul v-if="!loading && songs.length">
      <li v-for="song in songs" :key="song.song_position">

        <a href="#" @click.prevent="playSong(song.song_position)">
<!--          <span :class="{ current: song.isCurrent }">  -->
          <span :class="{ current: song.song_position === currentPosition }">

            <strong>{{ song.artist }}</strong>
            –
            {{ String(song.disc).padStart(2,'0') }}-{{ String(song.track).padStart(2,'0') }}
            -
            {{ song.title }}
            [{{ sec2sex(song.time) }}]
          </span>
        </a>

      </li>
    </ul>

  </div>
</template>

<style scoped>
.current {
  color: #d4af37;
  font-weight: bold;
}
</style>
