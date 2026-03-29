<template>
  <div>
    <!-- Desktop version -->
    <span class="desktop">
      <strong :class="colorClass">
        <span class="notes">♪ ♫</span>
        {{ stateText }}
        <span class="notes">♫ ♪</span>&nbsp;&nbsp;
      </strong>
      <a class="pauseicon" href="#" @click.prevent="$emit('action', 'toggle_playback')">
        <span :class="altClass">{{ toggleIcon }}</span>
      </a>&nbsp;
<!--    <a :class="colorClass" href="#" @click.prevent="$emit('action', 'playlist_current')" -->
        <a :class="colorClass" href="#" @click.prevent="$emit('action', { type: 'playlist_current', n: null })"

         title="Playlist|current song">#{{ status.player.song_position || '?' }}/{{ status.player.song_length || '?' }}</a> &nbsp;
      <a class="skipend" href="#" @click.prevent="$emit('action', 'next_track')">▶▮</a>
    </span>

    <!-- Mobile version -->
    <span class="mobile">
      <strong :class="colorClass">
        <span class="notes">♪ ♫</span>
        {{ stateText }}
        <span class="notes"> ♫ ♪</span>&nbsp;
      </strong>
      <a class="pauseicon" href="#" @click.prevent="$emit('action', 'toggle_playback')">
        <span :class="altClass">{{ toggleIcon }}</span>
      </a> &nbsp;&nbsp;&nbsp;
      <a :class="colorClass" href="#" @click.prevent="$emit('action', 'playlist_current')" title="Playlist|current song">
        &nbsp#{{ status.player.song_position || '?' }}/{{ status.player.song_length || '?' }}
      </a>
<!--      <a class="skipend" href="#" @click.prevent="$emit('action', 'next_track')"><span class="ts">▶</span> -->
      <a href="#" @click.prevent="$emit('action', 'next_track')" style="position:absolute">&nbsp; ⏭
      </a>
    </span>
    <br>

    <!-- Progress bar and timer -->
    <span class="time" id="current_track">
      <a href="#" @click.prevent="$emit('action', 'reset_track')" title="Restart track">
        elapsed <span id="elapsed_display">{{ elapsedDisplay }}</span>/<span id="total_display">{{ totalDisplay }}</span>
        (<span id="percent_display">{{ percentDisplay }}</span>%)
      </a>
<!--      <br>
      <progress id="track_progress" :value="percentValue" max="100"></progress> -->
    </span>
    <br>

    <!-- Track info -->
    <strong class="song">
      <a class="hidden-link" :href="`https://musicbrainz.org/mbid/${current.musicbrainz_releasetrackid}`" target="_blank">
        ({{ disc }}-{{ track }}) {{ current.title }}
      </a>
    </strong>
    <br>

    <!-- Artist -->
    <span class="artist">
      <strong>
        <a :href="`https://musicbrainz.org/artist/${current.musicbrainz_artistid}`" target="_blank">
          {{ current.artist }}
        </a>
      </strong>
    </span>
    <br>

    <!-- Album -->
    <span class="album">
      <strong>
        <a :href="`https://musicbrainz.org/release/${current.musicbrainz_albumid}`" target="_blank">
          {{ albumDisplay }}&nbsp
        </a>
<!--        <a href="#" @click.prevent="$emit('action', 'playlist_album')" title="Playlist|album"> -->
        <a href="#" @click.prevent="$emit('action', { type: 'playlist_album', n: null })" title="Playlist|album">
          <i class="bi bi-box-arrow-up-right extlink"></i>
        </a>
      </strong>
    </span>
    <br>

    <!-- Toggle path display -->
<!--    <span v-if="showPath" class="album file-path">
      {{ current.file }}
      <br>
    </span> -->
            <div v-if="showPath" class="album file-path">
            <span style="text-decoration: none; display: inline-block;">
            <a :href="'mpdlog://open?path=' + encodeURIComponent(current.file)">
              {{ current.file }}
            </a></span>
            </div>


    <!-- Status line - Desktop -->
    <span class="album desktop" style="font-style:normal">
      <a href="#" @click.prevent="$emit('action', 'mute_volume')">
        volume</a>: {{ status.player.volume }}%
      <span>
        <a href="#"
           class="repeat-toggle" style="font-style:normal"
           :class="{ active: status.player.repeat }"
           @click.prevent="$emit('action', 'toggle_repeat')">⟳ </a>
      </span>
      <span v-if="status.player.single">single: <span class="smallemoji desktop">{{ singleIcon }}&nbsp;</span></span>
      <a href="#" @click.prevent="$emit('action', status.player.random ? 'disable_random' : 'enable_random')">random:</a>
      <span class="smallemoji desktop">{{ randomIcon }} &nbsp;</span>

      <a href="#" @click.prevent="$emit('action', 'toggle_consume')">consume:</a>
      <span class="smallemoji desktop">{{ consumeIcon }}</span>
<!--
<a v-if="pauseTimerRem > 0" href="#" @click.prevent="$emit('toggleControlPanel', 'timer')">
  timer: {{ pauseTimerDisp }}
</a>
-->
<!-- monospace timer display example: -->
<!-- <span style="font-family: monospace;">  {{ pauseTimerDisp }} </span> -->
<template v-if="pauseTimerDisp !== '00:00'">
<a v-if="pauseTimerDisp !== '00:00'" href="#" @click.prevent="$emit('toggleControlPanel', 'timer')">
  <span v-if="pauseTimerDisp.startsWith('00:')" class="artist">
    <b>
      timer: {{ pauseTimerDisp }}
    </b>&nbsp
  </span>
  <span v-else>
    timer: {{ pauseTimerDisp }}&nbsp
  </span>
</a>
</template>
<template v-else>&nbsp</template>

      <!-- Linger desktop -->
      <span>
        <a href="#" @click.prevent="$emit('toggleControlPanel', 'linger')">
          {{ linger?.lingerxy ? 'lingerXY' : 'linger' }}:</a>&nbsp;
        <template v-if="!linger">
          <a class="smallemoji" href="#" @click.prevent="$emit('action', 'linger_start')">❌</a>
        </template>
        <template v-else>
          <span v-if="linger.paused" class="artist">
            <a class="pauseicon" href="#" style="font-style:normal;" @click.prevent="$emit('action','linger_toggle')">
              ▮▮
            </a>
            <a href="#" @click.prevent="$emit('toggleControlPanel', 'linger')">
              #{{ lingerStat }}
            </a>
          </span>
          <span v-else class="playing">
            <a href="#" style="font-style:normal;" class="hover-tooltip" @click.prevent="$emit('action','linger_toggle')">
              <span class="tooltip-text">Pause Linger</span>
              <span class="skipend" style="font-style:normal; color:green;"> ▶</span>&nbsp;&nbsp;&nbsp;
            </a>
            <a class="font-style:normal" href="#" @click.prevent="$emit('toggleControlPanel', 'linger')">
            <span class="font-style:normal">
              #{{ lingerStat }}
            </span>
            </a>
          </span>
            &nbsp;
  				<a class="hover-tooltip" href="#" style="font-style:normal" @click.prevent="$emit('action','linger_next')">
            <span class="tooltip-text">Next Linger Block</span>
            <a class="skipend" style= "font-style:normal; color:#007bff;">▶▮
            </a>
          </a>
        </template>
      </span>
    </span>


    <!-- Status line - Mobile -->
    <span class="album mobile">
      <a href="#" @click.prevent="$emit('action', 'mute_volume')">vol.:</a> {{ status.player.volume }}%

      <!-- <span v-if="repeatIcon">{{ repeatIcon }}</span> -->
      <span>
        <a href="#"
           class="repeat-toggle" style="font-style:normal; text-shadow:0 0 1px currentColor"
           :class="{ active: status.player.repeat }"
           @click.prevent="$emit('action', 'toggle_repeat')">⟳</a>&nbsp;</span>


      <a href="#" @click.prevent="$emit('action', 'toggle_single')">
      <span v-if="status.player.single" class="smallemoji mobile">{{ singleIcon }} &nbsp;</span></a>
      <a href="#" @click.prevent="$emit('action', 'toggle_random')">random:</a>
      <span class="smallemoji mobile">{{ randomIcon }}</span>
      <a href="#" @click.prevent="$emit('action', 'toggle_consume')">
      consume: </a><span class="smallemoji mobile" style="font-style:normal">{{ consumeIcon }}</span>

      <br>
<!--      <a v-if="pauseTimerRem > 0" href="#" @click.prevent="$emit('toggleControlPanel', 'timer')">
      <span v-if="pauseTimerRem < 60" class="artist mobile"> timer: <span class="artist mobile">{{ pauseTimerDisp }}</span></span>&nbsp;
      </a>
-->
      <a v-if="pauseTimer.remaining > 0" href="#" @click.prevent="$emit('toggleControlPanel', 'timer')">
        <span v-if="pauseTimer.remaining < 60" class="artist mobile">
          <b>timer: {{ pauseTimerDisp }}</b>
        </span>
        <span v-else>
          timer: {{ pauseTimerDisp }}
        </span>&nbsp;
      </a>

      <!-- Linger mobile -->
      <a href="#" @click.prevent="$emit('action', 'linger_next')">
        {{ linger?.lingerxy ? 'lingerXY:' : 'linger:' }}</a>&nbsp;
      <template v-if="!linger">
        <span class="smallemoji mobile">❌</span>
      </template>
      <template v-else style="font-style:normal;">
        <span v-if="linger.paused" style="color:red; font-style:normal;">
          <a href="#" style="font-style:normal;" @click.prevent="$emit('action','linger_toggle')">
            ⏯
          </a>
          &nbsp;#{{ linger.count || 0 }}/{{ linger.limit || 0 }}
        </span>
        <span v-else style="color:green; font-style:normal;">
          <a href="#" style="font-style:normal;" @click.prevent="$emit('action','linger_toggle')">
            ⏯
          </a>
          &nbsp;#{{ linger.count || 0 }}/{{ linger.limit || 0 }}
        </span>
        <a class="hover-tooltip" href="#" style="font-style:normal; color:#007bff;" @click.prevent="$emit('action','linger_next')">
          <span class="tooltip-text"> Next Linger Block</span>
<!--            <a class="skipend"style= "font-style:normal; color:#007bff;"> -->
<!--            <a href="#" @click.prevent="$emit('action', 'linger_next')" style="position:absolute"> -->
              &nbsp;⏭
<!--            </a> -->
<!--          </span> -->
        </a>

<!--
        &nbsp;&nbsp;
        <a class="skipend hover-tooltip" href="#" @click.prevent="$emit('action','linger_next')"><span class="tooltip-text">▶▮</span></a>
-->
      </template>
    </span>

    <br><hr>
  </div>
</template>

<script setup>
const debug = false
import { ref, computed, watch, onUnmounted, inject } from 'vue'
import { sec2sex } from '@/utils/time.js'

const props = defineProps({
  status: Object,
  current: Object,
  next: Object,
  linger: Object,
  showPath: Boolean,
  pauseTimer: Object,
  pauseTimerRem: Number,
  pauseTimerDisp: String,
})

if ( debug ) {
  console.log('props.pauseTimer.active:', props.pauseTimer.active)
  console.log('props.pauseTimerDisp', props.pauseTimerDisp)
}

const emit = defineEmits(['action', 'toggleControlPanel'])

const elapsed = ref(0)
const timerInterval = ref(null)

const stateText = computed(() =>
  props.status?.player?.state === 'play' ? 'playing' : 'paused'
)

const colorClass = computed(() =>
  props.status?.player?.state === 'play' ? 'playing' : 'artist'
)

const altClass = computed(() =>
  props.status?.player?.state === 'play' ? 'artist' : 'playing'
)

const toggleIcon = computed(() =>
  props.status?.player?.state === 'play' ? '▮▮' : '▶'
)

const disc = computed(() =>
  String(props.current?.disc || '0').padStart(2, '0')
)

const track = computed(() =>
  String(props.current?.track || '0').padStart(2, '0')
)

const albumDisplay = computed(() => {
  const album = props.current?.album || ''
  const year = props.current?.year?.split('-')[0] || ''
  return `${album.replace(' (mp3)', '')} ${year ? `(${year})` : ''}`
})

// keep injection (even if not used yet)
const layout = inject('layout')

const repeatIcon = computed(() => '⟳ ')
const singleIcon = computed(() =>
//  props.status?.player?.single ? '✅' : ''
  props.status?.player?.single ? '1️⃣' : ''
)

const randomIcon = computed(() =>
  props.status?.player?.random ? ' ✅' : ' ❌'
)

const consumeIcon = computed(() =>
  props.status?.player?.consume ? ' ✅' : ' ❌'
)

const elapsedDisplay = computed(() =>
  sec2sex(elapsed.value || 0)
)

const totalDisplay = computed(() =>
  sec2sex(props.status?.player?.duration || 0)
)

const percentDisplay = computed(() =>
  Math.floor(
    (elapsed.value / (props.status?.player?.duration || 1)) * 100
  )
)

const percentValue = computed(() => percentDisplay.value)

const lingerStat = computed(() => {
  const l = props.linger
  if (!l) return ''
  if (l.lingerxy) return `${l.lingerx}⚡${l.lingery}`
  const limit =
    l.limit !== l.baselimit ? `${l.limit}(${l.baselimit})` : l.limit
  return `${l.count}/${limit}`
})

watch(
  () => props.status?.player?.elapsed,
  (v) => {
    if (v !== undefined) elapsed.value = v
  },
  { immediate: true }
)

watch(
  () => props.status?.player?.state,
  (state) => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }

    if (state === 'play') {
      timerInterval.value = setInterval(() => {
        const dur = props.status?.player?.duration || 0
        if (elapsed.value < dur) elapsed.value++
      }, 1000)
    }
  },
  { immediate: true }
)

//watch(() => props.pauseTimerRem, (v) => {
//  console.log('pauseTimer', v)
//})

watch(
  () => [elapsed.value, props.status?.player?.duration],
  ([e, d]) => {
    if (!d) return
    if (e > d * 1.05 ) {
      console.log('CurrentlyPlaying: elapsed > duration * 1.05'),
      emit('action', 'json-status')
    }
  }
)


onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})
</script>

<style scoped>
.repeat-toggle.active {
  color: #22c55e;
}
</style>

<!--
writetime=2026-02-21T17:23:43.121311908-05:00
lingersong=947
lingersongid=986
lingerpause=0
lingercount=1
lingerbase=4
lingerlimit=6
lingerblocklmt=6
lingerpid=157577

writetime=2026-02-21T17:59:20.554450497-05:00
lingersong=947
lingersongid=1188
lingerpause=0
lingercount=2
lingerbase=4
lingerlimit=5
lingerblocklmt=5
lingerpid=157577
lingerxy=1
lingerx=1138
lingery=1150

  "linger": {
    "song": 414,
    "songid": "426",
    "count": 0,
    "baselimit": 4,
    "limit": 4,
    "blocklimit": 0,
    "paused": false,
    "lingerxy": false,
    "lingerx": 0,
    "lingery": 0
  }

-->
