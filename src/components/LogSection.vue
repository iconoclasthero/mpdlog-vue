<template>
  <div>
    <hr style="background-color:#912715">
    <strong class="time">🪵 of previous songs:</strong>
    <br><br>

    <template v-for="(entry, index) in entries" :key="index">
      <details name="Listen">
        <summary>
          <strong class="timestamp">
            @ {{ entry.timestamps.display }}, {{ entry.action }}
          </strong>
<!--        <span v-if="entry.notes" class="notes-info"> -->
            <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="notes-info">

            &nbsp; &nbsp; <br>
            <strong class="timestamp"><em>{{ entry.notes }}</em></strong>
          </span>
        </summary>
        <br>
        <audio controls preload="none" :src="`./${entry.url}`"></audio>
        <br><br>
      </details>

      <strong class="song">
        <a class="hidden-link" 
           :href="`https://musicbrainz.org/mbid/${entry.audio.musicbrainz_releasetrackid}`" 
           target="_blank">
          ({{ formatDisc(entry.audio.disc) }}-{{ formatTrack(entry.audio.track) }}) 
          {{ entry.audio.title }} - {{ formatDuration(entry.audio.duration) }}
        </a>
      </strong>
      <br>

      <strong class="artist">
        <a :href="`https://musicbrainz.org/artist/${entry.audio.musicbrainz_artistid}`" 
           target="_blank">
          {{ entry.audio.artist }}
        </a>
      </strong>
      <br>

      <strong class="album">
        <a :href="`https://musicbrainz.org/release/${entry.audio.musicbrainz_albumid}`" 
           target="_blank">
          {{ formatAlbum(entry.audio.album, entry.audio.year) }}
        </a>
      </strong>
      <br>
      <span v-if="showPath || viewMode === 'long'" class="album file-path">
        {{ entry.file }}
        <br>
      </span>

<!--      <span v-if="viewMode === 'long'" class="album">
        {{ entry.file }}
      </span>
      <br v-if="viewMode === 'long'">
-->
      <br>
    </template>
  </div>
</template>

<script>
export default {
  name: 'LogSection',
  props: {
    entries: Array,
    viewMode: String,
    showPath: Boolean
  },
  setup() {
    const formatDisc = (disc) => {
      return String(disc || '0').padStart(2, '0')
    }

    const formatTrack = (track) => {
      return String(track || '0').padStart(2, '0')
    }

    const formatDuration = (duration) => {
      const totalSec = Math.floor(parseFloat(duration || 0))
      const m = Math.floor(totalSec / 60)
      const s = totalSec % 60
      return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const formatAlbum = (album, year) => {
      const cleanAlbum = album?.replace(' (mp3)', '') || ''
      const yearPart = year?.split('-')[0] || ''
      return `${cleanAlbum} ${yearPart ? `(${yearPart})` : ''}`
    }

    return {
      formatDisc,
      formatTrack,
      formatDuration,
      formatAlbum
    }
  }
}
</script>

<style scoped>
.notes-info {
  font-size: 0.9em;
  opacity: 0.8;
}

details {
  margin-bottom: 0.5em;
}

summary {
  cursor: pointer;
}

summary:hover {
  opacity: 0.8;
}
</style>
