<template>
  <div>
    <!-- Header -->
<!--    <a class="hidden-link" href="http://iconoclasthero.com:8000">
      <img src="/android-icon-96x96.png" style="display: inline; vertical-align: top;">
    </a>
    <h1 style="display: inline; vertical-align: bottom;">
      &nbsp;&nbsp;<a class="hidden-link" href="/">mpdlog</a>
    </h1>
    <hr> -->

<div style="display: flex; align-items: center; gap: 16px;">
  <div style="position:relative; cursor:pointer;">
    <ProgressCircle
      v-if="status"
      :elapsed="Number(status.player.elapsed) || 0"
      :duration="status.player.duration"
      :color="ringColor"
      :playing="status.player.state==='play'"
      img-src="/android-icon-96x96.png"
      @seek="seekTo"
      @action="handleAction"
  />
<!--       :elapsed="status.player.elapsed" -->
<!--      @refresh-status="handleAction('json_status')" -->

     <!-- Icecast link overlay -->
     <a
       href="http://iconoclasthero.com:8000"
       target="_blank"
       style="position:absolute; bottom:4px; right:4px; font-size:10px;"
     >
       🔊
    </a>
   </div>

  <h1 style="margin: 0;">
    <a class="hidden-link" href="/">mpdlog</a>
  </h1>
</div>
<br>

<!-- Desktop
      background-color: #0dcaf0;
      background-color: #007bff;
      background: #222;


-->


<button
  class="menu-btn desktop"
  @click="showPanel = !showPanel"
  :style="{
    position: 'fixed',
    top: '12px',
    left: menuLeft + 'px',
    background: '#d94031',
    background: '#383838',
    background: '#1e2122',
    color: '#fff',
    color: '#383838',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
 }"
>
  ☰
</button>


<!-- Mobile -->
<button
  class="menu-btn mobile"
  @click="showPanel = !showPanel"
>
  ☰
</button>

    <!-- Currently Playing Section -->
    <CurrentlyPlaying
      v-if="status"
      :status="status"
      :current="current"
      :next="next"
      :linger="linger"
      :pulse_data="pulse_data"
      :pauseTimer="pauseTimer"
      :pauseTimerRem="pauseTimerRem"
      :pauseTimerDisp="sec2sex(pauseTimerRem)"
      :send-command="sendWebSocketCommand"
      :showPath="showPath"
      @toggleControlPanel="showPanel = !showPanel"
      @action="handleAction"
    />

    <!-- Album Art -->
    <AlbumArt
      v-if="current"
      :key="componentDebugKey"
      :artist="current.artist"
      :album-art-data="albumArtData"
      :mbArtistID="current.musicbrainz_artistid"
      @refreshArt="refreshAlbumArt"
    />

    <!-- Next Track -->
    <NextTrack
      v-if="next"
      :next="next"
      :showPath="showPath"
      @action="handleAction"
    />

    <!-- Log Section -->
    <LogSection
      v-if="logEntries.length > 0 && (viewMode === 'default' || viewMode === 'log' || viewMode === 'long' )"
      :entries="logEntries"
      :view-mode="viewMode"
      :showPath="showPath"
      @action="handleAction"
    />

    <PlaylistAlbum
      v-if="viewMode === 'album'"
      :songs="playlistAlbumSongs"
      :currentPosition="current?.song_position"
      :songID="current?.songID"
      :showPath="showPath"
      @action="handleAction"
    />

    <PlaylistCurrent
      v-if="viewMode === 'current'"
      :key="playlistCurrentN"
      :songs="playlistCurrentSongs"
      :currentPosition="current?.song_position"
      :playlistCurrentN="playlistCurrentN"
      :songID="current?.songID"
      :showPath="showPath"
      @action="handleAction"
    />

    <SearchView
    v-if="viewMode === 'search'"
      :showPath="showPath"     />

<!--    :results="searchResults"
    @ws-send="sendWS"
    @selection-change="handleSelection"
-->

    <!-- Navigation Buttons -->
    <NavButtons
      :view-mode="viewMode"
      :player-state="status?.player"
      :linger="linger"
      @action="handleAction"
      @change-view="changeView"
    />

    <!-- Back-to-Top Button -->
    <BackToTop :show="showBackTop" />

<ControlPanel
  :visible="showPanel"
  :linger="linger"
  :playlistCurrentN="playlistCurrentN"
  :activeTab="activeTab"
  :pauseTimer="pauseTimer"
  :pauseTimerMin="pauseTimerRem * 60"
  @update:pauseTimerMin="pauseTimerMin"
  @update:playlistCurrentN="val => playlistCurrentN = val"
  @update-current-window="setPlaylistCurrentN"
  @action="handleAction"
  @cmd="sendWebSocketCommand"
  @close="showPanel = false"
/>
  </div>

</template>

<script setup>
//type      TimerV1     struct {
//     Active           bool      `json:"active"`    // true if running
//     Duration         int       `json:"duration"`  // original set duration in seconds
//     EndTime          time.Time `json:"-"`         // internal only
//     Remaining        int       `json:"remaining"` // computed for StatusV1
//}


import { ref, onMounted, onUnmounted, provide, computed, watch } from 'vue'
import { sec2sex } from '@/utils/time.js'
import CurrentlyPlaying from './components/CurrentlyPlaying.vue'
import AlbumArt from './components/AlbumArt.vue'
import NextTrack from './components/NextTrack.vue'
import LogSection from './components/LogSection.vue'
import NavButtons from './components/NavButtons.vue'
import ControlPanel from './components/ControlPanel.vue'
import BackToTop from './components/BackToTop.vue'
import ProgressCircle from './components/ProgressCircle.vue'
import PlaylistAlbum from './components/PlaylistAlbum.vue'
import PlaylistCurrent from './components/PlaylistCurrent.vue'
import SearchView from './components/SearchView.vue'

let WS_DEBUG = false
let debug = false
const componentDebugKey = ref(0)
const componentDebug = ref(false)
const ws = ref(null)
const isConnected = ref(false)
const status = ref(null)
const current = ref(null)
const next = ref(null)
const linger = ref(null)
const pulse_data = ref(null)
//    const pause_timer = ref(null)
const logEntries = ref([])
const viewMode = ref('default')
const reconnectTimer = ref(null)
const albumArtData = ref(null)
const lastAlbumKey = ref(null)
const lastFile = ref(null)
//  const showBackTop = ref(false)
const showPanel = ref(false)
const activeTab = ref('linger')
const showPath = ref(false)
//  const ringColor = ref('#d94031')
//  const ringColor = ref('#db1212') // ok for phone?
const ringColor = ref('#d73e30')
const logBuffer = []
const playlistCurrentN = ref(12)   // the +/- around current playlist so that number of songs is (2*n)+1, e.g., grep -C<n>
const playlistCurrentSongs = ref([])
const playlistAlbumSongs = ref([])
const logLinesDefault = 24
const pauseTimer = ref(null)
const pauseTimerRem = ref(0)    // live countdown (seconds)
const pauseTimerMin = ref(0)
const menuLeft = ref(20)
let pauseInt = null
const logLines = ref(logLinesDefault)
let logFlushTimer = null
// NEW FLAG TO PREVENT INITIAL LOG REQUEST
let initialLoadDone = false

const showBackTop = true

provide('isConnected', isConnected)
provide('componentDebug', componentDebug)


// -----------------------------
// Layout determination
// -----------------------------

const layout = {
  narrow: ref(false),
  width: ref(window.innerWidth)
}

const mq = window.matchMedia('(max-width: 768px)')

const update = () => {
  layout.narrow.value = mq.matches
  layout.width.value = window.innerWidth
  if ( debug ) {
    console.log('[DEBUG App] layout.narrow: ', layout.narrow.value)
    console.log('[DEBUG App] layout.width: ', layout.width.value)
  }
}
provide('layout', layout)

// -------------------------------
// Command Bus for components
// -------------------------------
const cmdBus = {
  send(msg){
    if(!ws.value) return
    if(ws.value.readyState !== WebSocket.OPEN){
      console.log('ws not ready, dropping message')
      return
    }
    ws.value.send(JSON.stringify(msg))
  }
}

const resultBus = {
  listeners: {},
  on(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(fn)

    return () => {
      this.listeners[type] = this.listeners[type].filter(f => f !== fn)
    }
  },
  emit(type, data) {
    this.listeners[type]?.forEach(f => f(data))
  }
}

provide('cmdBus', cmdBus)
provide('resultBus', resultBus)

// -------------------------------
// Helper to log and send messages
// -------------------------------
const logAndSend = (msg) => {
  console.log('→ Sending WebSocket:', msg)
  if (WS_DEBUG && msg !== 'json-status' )
  console.log('[WS →]', typeof msg === 'string' ? JSON.parse(msg) : msg)

  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(msg)
  } else {
    console.error('WebSocket not connected, cannot send:', msg)
  }
}

// -------------------------------
// WebSocket connection
// -------------------------------
const connectWebSocket = () => {
  console.log("connectWebSocket called")
  if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket already open or connecting, skipping')
    return
  }

/* ------------------------- CHANGE THESE TWO LINES BEFORE BUILDING PRODUCITON --------------------------- */
//    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'                              //
//    const wsUrl = `${protocol}//${window.location.host}/ws`                                              //
  const wsUrl = 'ws://192.168.1.2:8008/ws'
  console.log('Connecting to WebSocket:', wsUrl)
  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    console.log('WebSocket connected')
    isConnected.value = true
    logAndSend(JSON.stringify({ system: 'websocket', cmd: 'subscribe' }))
    // status/log requests are handled by server push now
  }

  ws.value.onmessage = async (ev) => {
    if (ev.data instanceof Blob || ev.data instanceof ArrayBuffer) {
      const buffer = ev.data instanceof Blob
        ? await ev.data.arrayBuffer()
        : ev.data

      // Optional: detect type from magic bytes (JPEG vs PNG)
      const bytes = new Uint8Array(buffer)
      let mime = 'image/jpeg' // fallback

      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        mime = 'image/png'
      } else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        mime = 'image/jpeg'
      }

      const blob = new Blob([buffer], { type: mime })

      if (albumArtData.value?.startsWith('blob:')) {
        URL.revokeObjectURL(albumArtData.value)
      }

      albumArtData.value = blob.size > 0 ? URL.createObjectURL(blob) : null
    } else {
      let textData = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data)
      try {
        const msg = JSON.parse(textData)
        if (WS_DEBUG)
          console.log('[WS ←]', msg)
        if (msg.system === 'search') {
          resultBus.emit('search', msg)
          return
        }

        if (msg.system === 'websocket' && msg.cmd === 'subscribe' && msg.response === 'subscribed') {
          console.log('Subscription confirmed by server')
        } else {
          handleWebSocketMessage({ data: textData })
        }
      } catch {
        handleWebSocketMessage({ data: textData })
      }
    }
  }

  ws.value.onerror = (err) => console.error('WebSocket error:', err)
  ws.value.onclose = () => {
    console.log('[WS CLOSED]', { code: event.code, reason: event.reason, wasClean: event.wasClean })
    isConnected.value = false
    reconnectTimer.value = setTimeout(connectWebSocket, 3000)
  }
}



// -------------------------------
// Status / log / playlist helpers
// -------------------------------
const requestStatus = () => {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    logAndSend('json-status')
  }
}

const requestLog = () => {
  console.log("requestLog invoked, viewMode=", viewMode.value)
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    if (viewMode.value === "default") {
      logLines.value = logLinesDefault
      console.log("requestLog requesting default log")
      logAndSend(JSON.stringify({ system: 'mpd', cmd: 'json-log' }))
    }
    else if (viewMode.value === "long" || ( viewMode.value === "log" && loglines.value != "" )) {
      if (viewMode.value === "long") {
        logLines.value = 100
      }
      console.log("logAndSend JSON, logLines=", logLines.value)
      logAndSend(JSON.stringify({ system: 'mpd', cmd: 'json-log-stream', args: logLines.value }))
    }
  }
}

const setPlaylistCurrentN = (n) => {
  playlistCurrentN.value = Number(n) || 12
  handleAction({
    type: 'playlist_current',
    n: playlistCurrentN.value
  })
}


////////////////////////////////////////////////////////////////
//  PERIODIC REFRESH BLOCK:                                   //
////////////////////////////////////////////////////////////////
//    // Optional: periodic status refresh every N ms         //
//    const statusInterval = setInterval(() => {              //
//      requestStatus()                                       //
//    }, 5000) // 5s is reasonable for cheap requests         //
////////////////////////////////////////////////////////////////


// -------------------------------
// Handle incoming messages
// -------------------------------
const handleWebSocketMessage = async (event) => {
  const rawData = event.data

  if (rawData.includes('\n')) {
    const lines = rawData.trim().split('\n').filter(line => line.trim())
    const parsed = lines.map(line => {
      try { return JSON.parse(line) } catch { return null }
    }).filter(e => e !== null)
    logEntries.value = parsed
    return
  }

  let data
  try { data = JSON.parse(rawData) } catch (e) {
    console.error('Invalid JSON frame:', e)
    return
  }

  if (data.cmd === 'json-log' && Array.isArray(data.response)) {
    logEntries.value = data.response.slice(0, logLines.value)  // first N entries
    console.log('logEntries updated from json-log response, count=', logEntries.value.length)
    return
  }



  if (data.status || data.song) {
    status.value = data.status || status.value
    current.value = data.song || current.value
    return
  }

  if (data.system && data.cmd && data.response !== undefined) {
    if(data.system === "mpd" && data.cmd === "delete" &&
      data.response === "ok" && data.deleted > 0 &&
      viewMode.value === 'search'
    ){
      resultBus.emit("playlistChanged")
    }
    if (data.system === 'playlist' && data.cmd === 'playlist') {
      if ( debug ) console.log('[DEBUG App] playlist response received for viewMode:', viewMode.value, data.response)
    }
    if (data.system === 'playlist' && data.cmd === 'playlist') {
      if (!Array.isArray(data.response)) {
        console.error('Invalid playlist response:', data.response)
        if (viewMode.value === 'current') {
          playlistCurrentSongs.value = []
        } else if (viewMode.value === 'album') {
          playlistAlbumSongs.value = []
        }
        return
      }
      if (viewMode.value === 'current') {
        playlistCurrentSongs.value = data.response
      }
      if (viewMode.value === 'album') {
        playlistAlbumSongs.value = data.response
        console.log('App set playlistAlbumSongs:', playlistAlbumSongs.value.length)
      }
      return
    }
    if (data.system === 'playlist' && data.cmd === 'changed') {
      resultBus.emit('playlistChanged', data.response)
      return
    }
  }


  if (data.system === 'pulseaudio' && data.cmd === 'set_volume') {
    pulse_data.value.volume = data.response
  }

  if (data.system === 'pulseaudio' && data.cmd === 'changed') {
    pulse_data.value.volume = data.response.volume
    pulse_data.value.mute = data.response.mute
    if ( debug ) console.log('PA changed; volume:', data.response.volume)
    if ( debug ) console.log('PA changed; mute:', data.response.mute)
  }

  if (data.player && data.current) {
    const last = lastFile.value
    const newFile = data.current.file

    status.value = { player: data.player }
    current.value = data.current
    next.value = data.next
    linger.value = data.linger
//  pulse_data.value = data.pulse_data
    pulse_data.value = { ...data.pulse_data }
//  if ( debug ) console.log('[TEST pulse_data]', data.pulse_data?.volume)
    pauseTimer.value = data.pause_timer
    if ( debug ) {
      console.log('[DEBUG App] data.pause_timer:', data.pause_timer)
      console.log('[DEBUG App] pauseTimer.value:', pauseTimer.value)
    }
    if ( debug ) {
      console.log('[DEBUG App] pause timer:', {
        'data.pause_timer': data.pause_timer,
        'pauseTimer.value': pauseTimer.value
      })
    }
    updatePauseTimer(data.pause_timer)

    let albumKey
    const cur = data.current
    const lgr = data.linger

    if (cur.musicbrainz_albumid) {
      albumKey = cur.musicbrainz_albumid
    } else if (newFile) {
      const parts = newFile.split('/')
      albumKey = parts.slice(0, -1).join('/')
    } else if (cur.album && cur.albumartist) {
      albumKey = `${cur.albumartist} -- ${cur.album}`
    } else if (lgr?.songid) {
      albumKey = lgr.songid
    } else {
      albumKey = newFile
    }

    if (albumKey !== lastAlbumKey.value) {
      lastAlbumKey.value = albumKey
      if (last) {
        console.log('Album changed, refreshing art for:', newFile)
        refreshAlbumArt(newFile)
      }
    }

    // Track change logging + request log
    if (newFile && newFile !== last) {
      console.log('Track changed:', newFile)
      lastFile.value = newFile
      if (initialLoadDone) {  // <-- only request log after first load
        requestLog()
      } else {
        initialLoadDone = true
      }
    }
  }

  // inside handleWebSocketMessage, after parsing `data`
  if (Array.isArray(data) && data.length > 0 && data[0].timestamps && data[0].action) {
    // treat it like a batch of log entries
    logEntries.value = data.slice(0, logLines.value)  // keep the first N entries
    return
  }

  if (data.timestamps && data.action) {
    // Add to buffer instead of pushing immediately
    logBuffer.push(data)

    if (!logFlushTimer) {
      logFlushTimer = setTimeout(() => {
        logEntries.value.push(...logBuffer)
        if (logEntries.value.length > logLines.value) {
          logEntries.value = logEntries.value.slice(0, logLines.value)
        }
        logBuffer.length = 0
        logFlushTimer = null
      }, 50) // 50ms is small enough to be imperceptible
    }
  }
}

// -------------------------------
// Requests
// -------------------------------

// -------------------------------
// Outgoing commands
// -------------------------------
const sendCommand = (cmd) => {
  logAndSend(cmd)
  if (cmd !== 'json-status' && !cmd.includes('json-status')) {
    setTimeout(requestStatus, 100)
  }
//  setTimeout(requestStatus, 100)
}

const sendWebSocketCommand = (cmdObj) => {
  logAndSend(JSON.stringify(cmdObj))
}

// -------------------------------
// Action handler @ App.vue
// -------------------------------
const handleAction = (action) => {
  if ( debug ) console.log('[DEBUG App] handleAction:', action)
  if (action == 'viewDefault') {
    console.log('Action viewDefault received')
    viewMode.value = 'default'
    logLines.value = logLinesDefault
    requestLog()
    return
  }

  if (action == 'viewLong') {
    console.log('Action viewLong received')
    viewMode.value = 'long'
    requestLog()
    return
  }

  if (typeof action === 'object') {

    if (action.type === 'ignore-log-entry') {
      console.log('Ignoring log entry:', action.payload)
      sendCommand(JSON.stringify({
        system: 'mpd',
        cmd: 'ignore',
        args: action.payload
      }))
      return
    }


    if (action.type === 'pause_timer_on') {
      const sec = (Number(action.min) || 0) * 60
      if (sec <= 0) return

      sendCommand(JSON.stringify({
        system: 'pause_timer',
        cmd: 'on',
        args: sec
      }))
      return
    }

    if (action.type === 'pause_timer_off') {
      sendCommand(JSON.stringify({
        system: 'pause_timer',
        cmd: 'off'
      }))
      return
    }

    if (action.system === 'pulseaudio' && action.cmd === 'set_volume') {
      sendCommand(JSON.stringify(action))
      return
    }

    if (action.type === 'playlist_album') {
      console.log('Action Object: playlist_album received')
      viewMode.value = 'album'
      sendCommand(JSON.stringify({
        system: 'playlist',
        cmd: 'playlist',
        args: 'album'
      }))
      return
    }

    if (action.type === 'playlist_current') {
      viewMode.value = 'current'
      sendCommand(JSON.stringify({
        system: 'playlist',
        cmd: 'playlist',
        args: { current: action.n ?? playlistCurrentN.value }
      }))
      return
    }

    if (action.type === 'playPosition') {
      sendCommand(JSON.stringify({
        system: 'player',
        cmd: 'play',
        args: action.pos
      }))
      return
    }
  }

  const map = {
    toggle_playback: JSON.stringify({ system: 'player', cmd: 'togglestate' }),
    resume_playback: JSON.stringify({ system: 'player', cmd: 'resume' }),
    pause_playback:  JSON.stringify({ system: 'player', cmd: 'pause'}),
    prev_track:      JSON.stringify({ system:'mpd', cmd:'previous' }),
    next_track:      JSON.stringify({ system:'mpd', cmd:'next' }),
    reset_track:     JSON.stringify({ system:'mpd', cmd:'restart' }),
    enable_random:   JSON.stringify({ system:'mpd', cmd:'random', args:'1' }),
    disable_random:  JSON.stringify({ system:'mpd', cmd:'random', args:'0' }),
    toggle_random:   JSON.stringify({ system:'mpd', cmd:'togglerandom' }),
    enable_consume:  JSON.stringify({ system:'mpd', cmd:'consume', args:'1' }),
    disable_consume: JSON.stringify({ system:'mpd', cmd:'consume', args:'0' }),
    toggle_consume:  JSON.stringify({ system:'mpd', cmd:'toggleconsume' }),
    toggle_single:   JSON.stringify({ system:'mpd', cmd:'togglesingle' }),
    toggle_repeat:   JSON.stringify({ system:'mpd', cmd:'togglerepeat' }),
    ignore:          JSON.stringify({ system:'mpd', cmd:'ignore' }),
    DOWN_VOLUME:     JSON.stringify({ system:'pulseaudio', cmd:'set_volume', args:"-5" }),
    down_volume:     JSON.stringify({ system:'pulseaudio', cmd:'set_volume', args:"-1" }),
    up_volume:       JSON.stringify({ system:'pulseaudio', cmd:'set_volume', args:"+1" }),
    UP_VOLUME:       JSON.stringify({ system:'pulseaudio', cmd:'set_volume', args:"+5" }),
    mute_volume:     JSON.stringify({ system:'pulseaudio', cmd:'mute_volume' }),
//      pause_timer_on:  JSON.stringify({ system:'pause_timer', cmd:'on', args:'pauseTimerDur' }),
//      pause_timer_off: JSON.stringify({ system:'pause_timer', cmd:'off' }),
    linger_next:     JSON.stringify({ system:'linger', cmd:'next' }),
    linger_start: 'linger-start',
    linger_toggle: 'toggle',
    toggle_output: 'toggle-output',
    json_status: 'json-status'
  }
  if (map[action]) {
    if ( debug ) console.log('[DEBUG App] sending:', map[action])
    sendCommand(map[action])
  }
}

const changeView = (mode) => { viewMode.value = mode }


const handleVisibilityChange = () => {
  if (!document.hidden && isConnected.value) {
    requestStatus()
    // Only refresh art if track changed (status response will handle it)
  }
}

const handleFocus = () => {
  if (isConnected.value) {
    if ( debug ) console.log('[DEBUG App] handleFocus triggered → requesting status')
    requestStatus()
    // requestLog() removed here to prevent extra first-load log
    // Only refresh art if track changed (status/log response will handle it)
  }
}

const blockLimitPrompt = () => {
  let input = prompt("Enter value for a new block limit...\n0 cancels the existing block limit:")
  if (input === null) return
  input = input.trim()
  if (!/^[-+]?\d+$/.test(input)) {
    alert("Must be an integer")
    return
  }
  const n = parseInt(input, 10)
  if (ws.value?.readyState === WebSocket.OPEN) {
//        ws.value.send(JSON.stringify({ system: "linger", cmd: "blocklimit", args: n }))
    sendCommand(JSON.stringify({ system: "linger", cmd: "blocklimit", args: n }))
    console.log("readyState:", ws.value.readyState)
    console.log("→ Sent blocklimit:", n)
  } else {
    console.error("WebSocket not connected")
  }
}

const updatePauseTimer = (t) => {
  if (pauseInt) {
    clearInterval(pauseInt)
    pauseInt = null
  }

  if (t?.active) {
    pauseTimerRem.value = t.remaining
    if ( debug ) console.log('[DEBUG App] pauseTimerRem.value:', pauseTimerRem.value)
    pauseInt = setInterval(() => {
      pauseTimerRem.value--

      if (pauseTimerRem.value <= 0) {
        clearInterval(pauseInt)
        pauseInt = null
        pauseTimerRem.value = 0
      }
    }, 1000)
  } else {
    pauseTimerRem.value = 0
  }
}


// const activeTimer = computed(() => pauseTimer.value?.active || pauseTimer.value?.duration > 0)
const activeTimer = computed(() => pauseTimer.value?.active)
if ( debug ) {
  console.log('[DEBUG App] pauseTimer.value:', pauseTimer.value)
  console.log('[DEBUG App] activeTimer.value:', activeTimer.value)
  console.log('[DEBUG App] pauseTimer.value?.active:', pauseTimer.value?.active)
}

const seekTo = (seconds) => {
  const payload = {
    system: "mpd",
    cmd: "seek",
    args: Math.floor(seconds)
  }

  ws.value.send(JSON.stringify(payload))
}

const goTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}


// this doesn't work:
// 1. `file` doesn't exist here.  Presumabyly it's like status.player.file or some bullshit
// 2. the GoBE doesn't accept any args at this point
// 3. it had been coded to use `URI`, presumably from the client, but there's no arg parsing
// 4. and so now it's coded to get the currentsong's file and use that in c.ReadPicture
// 5. and there's no fallback to the other picture method, artwhatever.

const refreshAlbumArt = (file = current.value.file) => {
  if ( debug ) console.log('[DEBUG App] current.value.file: ', current.value.file)
  logAndSend(JSON.stringify({ system: 'mpd', cmd: 'albumart', args: current.value.file }))
}

// Unified keydown handler
const handleKeydown = (ev) => {
  const key = ev.key.toLowerCase()

  // Alt+B → blocklimit modal
  if (ev.altKey && key === 'b') {
    ev.preventDefault()
    blockLimitPrompt()
  }

  // Alt+C → toggle ControlPanel
  if (ev.altKey && key === 'c') {
    ev.preventDefault()
    showPanel.value = !showPanel.value
  }

  // Alt+D → turn debug true
  if (ev.altKey && key === 'd') {
    if ( debug && WS_DEBUG && componentDebug.value) {
      WS_DEBUG = false
      debug = false
      componentDebug.value = false
      componentDebugKey.value = 0
      console.log('[DEBUG App] debug set to ', debug)
      console.log('[DEBUG App] componentDebug set to ', componentDebug)
      console.log('[DEBUG App] WS_DEBUG set to ', WS_DEBUG)
      return
    }
    if ( debug && componentDebug.value ) {
      WS_DEBUG = true
      console.log('[DEBUG App] WS_DEBUG set to ', WS_DEBUG)
    }
    if ( debug ) {
      if (! componentDebug.value) componentDebugKey.value++
      componentDebug.value = true
      console.log('[DEBUG App] componentDebug set to ', componentDebug.value)
    }
    debug = true
    console.log('[DEBUG App] debug set to ', debug)
  }

  // Alt+S → toggle Search
  if (ev.altKey && key === 's') {
    ev.preventDefault()
    if (viewMode.value !== 'search') { viewMode.value = 'search' }
    else { viewMode.value = 'default' }
  }

  if (ev.altKey && ev.key.toLowerCase() === 'p') {
    ev.preventDefault()
    showPath.value = !showPath.value
  }

}


const statusLine = document.querySelector('.album.desktop')
if (statusLine) {
  const rect = statusLine.getBoundingClientRect()
  menuLeft.value = rect.left + rect.width * 1.5
}

if ( debug ) {
  watch(activeTimer, (v) => {
    console.log('[DEBUG App] activeTimer changed:', v)
  })
}

onMounted(() => {
  connectWebSocket()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleFocus)
//  window.addEventListener('scroll', handleScroll)

  // --- attach keydown listener for multiple shortcuts ---
  window.addEventListener('keydown', handleKeydown)

  let chk = setInterval(() => {
    const el = document.querySelector('.album.desktop')
    if ( debug ) console.log('[DEBUG App] MENU RETRY:', !!el)

    if (el) {
      const r = el.getBoundingClientRect()
      menuLeft.value = r.left + r.width * 1.5
      clearInterval(chk)
    }
  }, 50)

  update()
  window.addEventListener('resize', update)
  mq.addEventListener('change', update)
})

onUnmounted(() => {
  ws.value?.close()
  if (reconnectTimer.value) clearTimeout(reconnectTimer.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleFocus)
  window.removeEventListener('scroll', handleScroll)

  // --- detach keydown listener ---
  window.removeEventListener('keydown', handleKeydown)

  // --- clear timer interval ---
  if (pauseInt) clearInterval(pauseInt)
  mq.removeEventListener('change', update)
})
</script>

<style>
.menu-btn.mobile {
  position: fixed;
  top: 12px;
  right: 12px;
}

</style>
