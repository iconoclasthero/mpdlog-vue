<template>
  <div>
    <hr style="background-color:#912715">
    <strong class="time">🪵 of previous songs:</strong>
    <br><br>

<!--    <template v-for="(entry, index) in entries" :key="index"> -->
    <template v-for="(entry, index) in logEntries" :key="index">
      <details name="Listen">
        <summary>
          <strong class="timestamp">
<!--            @ {{ entry.timestamps.display }}, {{ entry.action }} -->
              @ {{ entry.timestamps.display }},
              {{ entry.action === 'skipped-ignored'
                  ? 'skipped and ignored'
                  : entry.action }}

          </strong>
<!--        <span v-if="entry.notes" class="notes-info"> -->
<!--            <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="notes-info">
            &nbsp; &nbsp; <br>
            <strong class="timestamp"><em>{{ entry.notes }}</em></strong>
          </span>
-->
        <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="timestampbubble">🗩</span>
        </summary>
        <!-- notes now inside details dropdown -->
        <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="notes-info">
          <em>&nbsp;&nbsp;&nbsp;{{ entry.notes }}</em>
        </span>
        <br>
        <audio controls preload="none" :src="`/library/music/${entry.url}`"></audio>
        <br><br>
      </details>

<!--      <strong class="song"> -->
        <strong
          class="song"
          :class="{
            ignored: entry.action === 'ignored',
            skipped: entry.action === 'skipped',
            'skipped-ignored': entry.action === 'skipped-ignored'
          }"
        >
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
import { computed } from 'vue'
import { sec2sex } from '@/utils/time.js'

export default {
  name: 'LogSection',
  props: {
    entries: Array,
    viewMode: String,
    showPath: Boolean
  },
  setup(props) {
    const formatDisc = (disc) => {
      return String(disc || '0').padStart(2, '0')
    }

    const formatTrack = (track) => {
      return String(track || '0').padStart(2, '0')
    }

//    const formatDuration = (duration) => {
//      const totalSec = Math.floor(parseFloat(duration || 0))
//      const m = Math.floor(totalSec / 60)
//      const s = totalSec % 60
//      return `${m}:${s < 10 ? '0' : ''}${s}`
//    }

    const formatDuration = (duration) => sec2sex(duration || 0)
//  const formatDuration = sec2sex(parseFloat(duration || 0))

    const formatAlbum = (album, year) => {
      const cleanAlbum = album?.replace(' (mp3)', '') || ''
      const yearPart = year?.split('-')[0] || ''
      return `${cleanAlbum} ${yearPart ? `(${yearPart})` : ''}`
    }

    // --- merged log entries for skipped+ignored ---
    const logEntries = computed(() => {
      const result = []
      const list = props.entries || []

      for (let i = 0; i < list.length; i++) {
        const cur = list[i]
        const next = list[i + 1]

        if (
          cur?.action === 'skipped' &&
          next?.action === 'ignored' &&
          cur.file === next.file
        ) {
          result.push({
            ...cur,
            action: 'skipped-ignored'
          })
          i++
          continue
        }

        result.push(cur)
      }

      return result
    })





    return {
      logEntries,
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
  color: #80cbc4;
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

.ignored,
.skipped,
.skipped-ignored {
  text-decoration: line-through;
  text-decoration-color: #d73e30;
  text-decoration-thickness: 3px;
}

.timestampbubble {
  font-size: 0.55em;
  opacity: 0.6;
  margin-left: 0.5em;
  color: #80cbc4;
  vertical-align: +7px;
}
</style>
