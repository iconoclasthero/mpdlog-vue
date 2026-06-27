<template>
  <hr style="background-color:#912715">
  <div>
    <span class="time">
      <strong><em>
        ✨</em><a href="#" @click.prevent="$emit('action', 'next_track')" title="Play next song">
          Next in queue
        </a><em>✨</em></strong>&nbsp;
        <a v-if="viewMode !== 'current'"
          href="#" @click.prevent="$emit('action', { type: 'playlist_current', n: null })" title="Playlist|current song"
          style="color: white;"
        >
          <i class="bi bi-box-arrow-up-right extlink"></i>
        </a>
        <a v-else
          href="#" @click.prevent="$emit('change-view', 'default')" title="Playlist|return"
          style="color: white; font-style: normal; vertical-align: super; font-size: 0.8em; line-height: 1;"
        >
        <i class="bi bi-arrow-return-left"></i>
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
    <div v-if="showPath" class="album file-path">
    <span style="text-decoration: none; display: inline-block;">
    <a :href="'mpdlog://open?path=' + encodeURIComponent(next.file)">
      {{ next.file }}
    </a></span>
    </div>

  </div>
</template>

<script>
import { computed } from 'vue'
import { sec2sex } from '@/utils/time.js'

export default {
  name: 'NextTrack',
  props: {
    next: Object,
    showPath: Boolean,
    viewMode: String,
  },
  emits: ['action', 'change-view'],
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
