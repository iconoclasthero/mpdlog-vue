<template>
  <div>
    <hr style="background-color:#912715">
    <strong class="time">🪵 of previous songs:</strong> &nbsp;
<!-- <span
  :title="isScrobbling
    ? 'Disable Last.fm scrobbling'
    : 'Enable Last.fm scrobbling'"
>
-->
<lastFM
  class="scrobbler-icon"
  :isScrobbling="isScrobbling"
  @click="$emit('action', 'toggle_scrobbler')"
/>
<!-- </span> -->

<br><br>
    <template v-for="(entry, index) in logEntries" :key="index">
      <details name="Listen">
        <summary>
          <strong class="timestamp">
              @ {{ entry?.timestamps?.display }},
              {{ entry.action === 'skipped-ignored'
                  ? 'skipped and ignored'
                  : entry.action }}
          </strong>
        <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="timestampbubble">🗩</span>
        </summary>
        <!-- notes now inside details dropdown -->
        <span v-if="entry.notes && entry.notes !== 'Found via relative path lookup.'" class="notes-info">
          <em>&nbsp;&nbsp;&nbsp;{{ entry.notes }}</em>
        </span>
        <br>
        <audio controls preload="none" :src="`/library/music/${entry.url}`"></audio>
        <br>
        <br>
        <a href="#" style="color: crimson;font-weight: bold;" @click.prevent="$emit('action', { type: 'ignore-log-entry', payload: entry.file })" title="Ignore log entry">🚫 Ignore this song </a>
        <br>
        <a :href="`https://covers.musichoarders.xyz?album=${encodeURIComponent(entry.audio.album)}&artist=${encodeURIComponent(entry.audio.artist)}`"
          style="color: lightblue; font-weight: bold;" target="_blank" title="Search cover art">
          <BinocularsIcon/> Search cover art
        </a>
      <br>

       <a href="#" @click.prevent="$emit('action', { type: 'add-log-entry-next', payload: entry.file })" title="Enqueue log entry"> <i class="bi bi-arrow-return-right" aria-hidden="true"></i>&nbsp;<i class="bi bi-music-note-list"></i>&nbsp;Enqueue this song next</a>

      </details>

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
      <span v-if="showPath" class="album file-path">

        <span style="text-decoration: none; display: inline-block;">
        <a :href="'mpdlog://open?path=' + encodeURIComponent(entry.file)">
          {{ entry.file }}
        </a></span>
        <br>
      </span>
      <br>
    </template>
  </div>
</template>

<script>

import { ref, computed, watch } from 'vue'
import { sec2sex } from '@/utils/time.js'

import onIcon from '@/assets/last-fm-on.vue'
import offIcon from '@/assets/last-fm-off.vue'
import lastFM from '@/assets/lastFM.vue'
import BinocularsIcon from '@/assets/binocularsIcon.vue'

export default {
  name: 'LogSection',
  emits: ['action'],
  props: {
    entries: Array,
    viewMode: String,
    showPath: Boolean,
    scrobbler: Object
  },
  components: {
    BinocularsIcon,
    lastFM,
    onIcon,
    offIcon
  },
  setup(props, { emit }) {
    const internalEntries = ref(props.entries || [])
    const internalViewMode = ref(props.viewMode || 'short')
    const isScrobbling = ref(false)

    watch(() => props.scrobbler?.running, v => {
      isScrobbling.value = !!v },
      { immediate: true }
    )

//    const scrobbler = computed(() =>
//      props.scrobbler || { enabled: false, running: false }
//    )


    watch(() => props.entries, v => {
      internalEntries.value = v || []
    })

    watch(() => props.viewMode, v => {
      internalViewMode.value = v || 'short'
    })

    const formatDisc = d => String(d || '0').padStart(2, '0')
    const formatTrack = t => String(t || '0').padStart(2, '0')
    const formatDuration = d => sec2sex(d || 0)

    const formatAlbum = (album, year) => {
      const clean = album?.replace(' (mp3)', '') || ''
      const y = year?.split('-')[0] || ''
      return `${clean} ${y ? `(${y})` : ''}`
    }

    const logEntries = computed(() => {
      const list = internalEntries.value || []
      const result = []

      for (let i = 0; i < list.length; i++) {
        const cur = list[i]
        const next = list[i + 1]

        if (cur?.action === 'skipped' &&
            next?.action === 'ignored' &&
            cur.file === next.file) {
          result.push({ ...cur, action: 'skipped-ignored' })
          i++
          continue
        }

        result.push(cur)
      }

      return result
    })

    return {
      internalEntries,
      internalViewMode,
      logEntries,
      formatDisc,
      formatTrack,
      formatDuration,
      formatAlbum,
      BinocularsIcon,
      isScrobbling,
      lastFM,
    }
  }
}
//  import { ref, reactive, computed, watch } from 'vue'
//  import { sec2sex } from '@/utils/time.js'
////  import binocularsIcon from '@/assets/binoculars.svg'
//  import BinocularsIcon from '@/assets/binocularsIcon.vue'
//  import onIcon from '@/assets/last-fm-on.svg'
//  import offIcon from '@/assets/last-fm-off.svg'
//
//  export default {
//    name: 'LogSection',
//    emits: ['action', 'scrobbler-cmd'],
//    props: {
//      entries: Array,
//      viewMode: String,
//      showPath: Boolean,
//      scrobbler: Object
//    },
//    components: {
//      BinocularsIcon
//    },
//methods: {
//  toggleScrobbler() {
//    const cmd = this.scrobbler?.enabled ? "off" : "on"
//    this.$emit("scrobbler-cmd", cmd)
//  }
//},
//
//    setup(props) {
//      // --- reactive copies of props ---
//      const internalEntries = ref(props.entries || [])
//      const internalViewMode = ref(props.viewMode || 'short')
//
//      // --- watch props.entries ---
//      watch(
//        () => props.entries,
//        newVal => {
//          internalEntries.value = newVal || []
//        }
//      )
//
//      // --- watch props.viewMode ---
//      watch(
//        () => props.viewMode,
//        newMode => {
//          internalViewMode.value = newMode || 'short'
//          console.log('viewMode changed to', internalViewMode.value)
//          // you could recalc derived values here if needed
//        }
//      )
//
//      // --- formatting helpers ---
//      const formatDisc = disc => String(disc || '0').padStart(2, '0')
//      const formatTrack = track => String(track || '0').padStart(2, '0')
//      const formatDuration = duration => sec2sex(duration || 0)
//      const formatAlbum = (album, year) => {
//      const cleanAlbum = album?.replace(' (mp3)', '') || ''
//      const yearPart = year?.split('-')[0] || ''
//      return `${cleanAlbum} ${yearPart ? `(${yearPart})` : ''}`
//    }
//
//    // --- merged log entries for skipped+ignored ---
//    const logEntries = computed(() => {
//      const list = internalEntries.value || []
//      const result = []
//
//      for (let i = 0; i < list.length; i++) {
//        const cur = list[i]
//        const next = list[i + 1]
//
//        if (cur?.action === 'skipped' && next?.action === 'ignored' && cur.file === next.file) {
//          result.push({ ...cur, action: 'skipped-ignored' })
//          i++
//          continue
//        }
//
//        result.push(cur)
//      }
//
//      return result
//    })
//
//    return {
//      internalEntries,
//      internalViewMode,
//      logEntries,
//      formatDisc,
//      formatTrack,
//      formatDuration,
//      formatAlbum,
//      scrobbler,
//      toggleScrobbler,
//    }
//  } //setup props
//}
//</script>

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

.skipped {
  text-decoration: line-through;
/*  text-decoration-color: #d73e30; */
  text-decoration-color: #facc15;
  text-decoration-thickness: 0.1em;
}

.ignored,
.skipped-ignored {
  text-decoration: line-through;
  text-decoration-color: #1e2122; /* #d73e30; */
  text-decoration-thickness: 3px;
}

.timestampbubble {
  font-size: 0.55em;
  opacity: 0.6;
  margin-left: 0.5em;
  color: #80cbc4;
  vertical-align: +7px;
}

.scrobbler-icon {
  width: 25px;
  height: 25px;
  max-width: 25px;
  max-height: 25px;
  display: inline-block;
  cursor: pointer;
}

.scrobbler-icon path {
  fill: white;
}

</style>
