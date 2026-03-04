<template>
  <div>
    <span class="time">
      <strong><em>
        ✨</em><a href="#" @click.prevent="$emit('action', 'next_track')" title="Play next song">
          Next in queue
        </a><em>✨</em></strong>&nbsp;
<!--      <a href="#" @click.prevent="$emit('action', 'playlist_current')" title="Playlist|current song"> -->
        <a href="#" @click.prevent="$emit('action', { type: 'playlist_current', n: null })" title="Playlist|current song">

        <i class="bi bi-box-arrow-up-right extlink"></i>
      </a>
    </span>
    <br>
    <strong class="song"><em>
      <a class="hidden-link" 
         :href="`https://musicbrainz.org/mbid/${next.musicbrainz_releasetrackid}`" 
         target="_blank">
        ({{ disc }}-{{ track }}) {{ next.title }} - {{ duration }}
      </a>
    </em></strong>
    <br>
    <span class="artist">
      <strong><em>
        <a :href="`https://musicbrainz.org/artist/${next.musicbrainz_artistid}`" target="_blank">
          {{ next.artist }}
        </a>
      </em></strong>
    </span>
    <br>
    <span class="album">
      <strong><em>
        <a :href="`https://musicbrainz.org/release/${next.musicbrainz_albumid}`" target="_blank">
          {{ albumDisplay }}
        </a>
      </em></strong>
    </span>
    <br>
    <span v-if="showPath" class="album file-path">
      {{ next.file }}
    </span>
    <br v-if="showPath">
  </div>
</template>

<script>
import { computed } from 'vue'
import { sec2sex } from '@/utils/time.js'

export default {
  name: 'NextTrack',
  props: {
    next: Object,
    showPath: Boolean
  },
  emits: ['action'],
  setup(props) {
    const disc = computed(() => {
      return String(props.next?.disc || '0').padStart(2, '0')
    })

    const track = computed(() => {
      return String(props.next?.track || '0').padStart(2, '0')
    })

//    const duration = computed(() => {
//      const totalSec = Math.floor(parseFloat(props.next?.duration || 0))
//      const m = Math.floor(totalSec / 60)
//      const s = totalSec % 60
//      return `${m}:${s < 10 ? '0' : ''}${s}`
//    })

    const duration = computed (() => sec2sex(props.next?.duration || 0))

    const albumDisplay = computed(() => {
      const album = props.next?.album || ''
      const year = props.next?.year?.split('-')[0] || ''
      return `${album.replace(' (mp3)', '')} ${year ? `(${year})` : ''}`
    })

    return {
      disc,
      track,
      duration,
      albumDisplay
    }
  }
}
</script>
