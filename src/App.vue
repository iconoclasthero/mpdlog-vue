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
      v-if="player"
      :elapsed="Number(player.elapsed) || 0"
      :duration="player.duration"
      :color="ringColor"
      :playing="player.state==='play'"
      :playerStatusUpdate="playerStatusUpdate"
      img-src="/android-icon-96x96.png"
      @seek="seekTo"
      @action="handleAction"
    />

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
<!--      :send-command="sendWebSocketCommand" -->
    <CurrentlyPlaying
      v-if="player"
      :player="player"
      :current="current"
      :next="next"
      :linger="linger"
      :pulse_data="pulse_data"
      :pauseTimer="pauseTimer"
      :pauseTimerRem="pauseTimerRem"
      :pauseTimerDisp="sec2sex(pauseTimerRem)"
      :playerStatusUpdate="playerStatusUpdate"
      :showPath="showPath"
      :viewMode="viewMode"
      @toggleControlPanel="showPanel = !showPanel"
      @action="handleAction"
      @change-view="changeView"
    />

    <!-- Album Art -->
    <AlbumArt
      v-if="viewMode !== 'artwork' && current"
      :key="componentDebugKey"
      :artist="current.artist"
      :albumArtData="albumArtData"
      :mbArtistID="current.musicbrainz_artistid"
      :current="current"
      @refreshArt="refreshAlbumArt"
      @action="handleAction"
    />

    <!-- Next Track -->
    <NextTrack
      v-if="viewMode !== 'artwork' && next"
      :next="next"
      :showPath="showPath"
      :viewMode="viewMode"
      @action="handleAction"
      @change-view="changeView"
    />

    <!-- Log Section -->
    <LogSection
      v-if="viewMode === 'default' || viewMode === 'log' || viewMode === 'long'"
      :entries="logEntries"
      :view-mode="viewMode"
      :showPath="showPath"
      @action="handleAction"
    />

    <PlaylistAlbum
      v-else-if="viewMode === 'album'"
      :songs="playlistAlbumSongs"
      :currentPosition="current?.song_position"
      :songID="current?.songID"
      :showPath="showPath"
      :plRev="player?.playlist_rev"
      @action="handleAction"
    />

    <PlaylistCurrent
      v-else-if="viewMode === 'current'"
      :key="playlistCurrentN"
      :songs="playlistCurrentSongs"
      :currentPosition="current?.song_position"
      :playlistCurrentN="playlistCurrentN"
      :songID="current?.songID"
      :showPath="showPath"
      @action="handleAction"
    />

    <SearchView
      v-else-if="viewMode === 'search'"
      :showPath="showPath"
    />

<!--       :send-command="sendWebSocketCommand" -->

    <ArtworkView
      v-else-if="viewMode === 'artwork'"
      :key="componentDebugKey"
      :player="player"
      :current="current"
      :next="next"
      :showPath="showPath"
      :path="artworkPath"
    />

    <!-- Navigation Buttons -->
    <NavButtons
      :view-mode="viewMode"
      :player-state="player"
      :linger="linger"
      @action="handleAction"
      @change-view="changeView"
    />

    <!-- Back-to-Top Button -->
    <BackToTop :show="showBackTop" />

    <ControlPanel
      :player="player"
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
      @cmd="cmd => sendCommand(cmd, 'ControlPanel')"
      @close="showPanel = false"
    />


  </div>

  <div class="notification-container">
    <div v-for="n in notifications" :key="n.id" class="notification">
      {{ n.msg }}
    </div>
  </div>

</template>

<script setup>
//type      TimerV1     struct {
//     Active           bool      `json:"active"`    // true if running
//     Duration         int       `json:"duration"`  // original set duration in seconds
//     EndTime          time.Time `json:"-"`         // internal only
//     Remaining        int       `json:"remaining"` // computed for StatusV1
//}


import { ref, onMounted, onUnmounted, provide, computed, watch, } from 'vue'
import fnv1a from '@sindresorhus/fnv1a'
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
import ArtworkView from './components/ArtworkView.vue'

const requestStatusDebounce = 100
const requestStatusDelay = 150
const handleFocusDebounce = 1500
let WS_DEBUG = true
let debug = false
const componentDebugKey = ref(0)
const componentDebug = ref(false)
console.log('[App] debug=', debug, 'wsdebug=', WS_DEBUG, 'componentDebug=', componentDebug.value)


const viewMode = ref('default')
const params = new URLSearchParams(location.search)
viewMode.value = params.get('view') || 'default'

const ws = ref(null)
const wsQueue = []
const enqueue = (cmd) => wsQueue.push(cmd)

const flushQueue = () => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return
//  while (wsQueue.length) logAndSend(wsQueue.shift())
  while (wsQueue.length) sendCommand(wsQueue.shift(), "flushQueue")
}

const art = {
  hash: null,
  note: null,
  pending: null,
  blob: null,
  url: null,
  meta: null
}

const albumArtData = ref(null)

const isConnected = ref(false)
const player = ref(null)
const current = ref(null)
const next = ref(null)
const linger = ref(null)
const pulse_data = ref(null)
const logEntries = ref([])
const reconnectTimer = ref(null)
const lastArtHash = ref(null)
const lastArtUrl = ref(null)
const lastAlbumKey = ref(null)
const lastFile = ref(null)
const lastSongID = ref(null)
const artworkPath = ref(null)
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
const menuLeft = ref(20)
let pauseInt = null
const pauseTimer = ref(null)
const pauseTimerMin = ref(0)
const pauseTimerRem = ref(0)    // live countdown (seconds)
const playerStatusUpdate = ref(0)
const albumArtMeta = ref(null)
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
      console.log('[App] ws not ready, dropping message')
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

//// -------------------------------
//// Helper to log and send messages
//// -------------------------------
//const logAndSend = (msg) => {
//  if (! WS_DEBUG) console.log('→ Sending WebSocket:', msg)
//  if (WS_DEBUG && msg !== 'json-status' ){
////  console.log('[→ WS]', typeof msg === 'string' ? JSON.parse(msg) : msg)  // throws errors with e.g., json-log
//    let logged = msg
//
//    if (typeof msg === 'string') {
//      try {
//        logged = JSON.parse(msg)
//      } catch {
//        logged = msg
//      }
//    }
//
//    console.log('[→ WS]', logged)
//  }
//
////  to show outgoing commands outside of WS_DEBUG=true
////  console.log('→ Sending WebSocket:', msg)
////  console.log('[→ WS]', msg)
//
//  if (ws.value?.readyState === WebSocket.OPEN) {
//    ws.value.send(msg)
//  } else {
//    console.info('[App] WebSocket not connected, enqueuing msg:', msg)
//    enqueue(msg)
//  }
//} // const logAndSend


// -------------------------------
// WebSocket connection
// -------------------------------
const connectWebSocketRouter = () => {
  console.log("[App] connectWebSocketRouter called")

  if (
    ws.value &&
    (ws.value.readyState === WebSocket.OPEN ||
     ws.value.readyState === WebSocket.CONNECTING)
  ) {
    console.log('[App] WebSocket already open or connecting, skipping')
    return
  }

/* ------------------------- CHANGE THESE TWO LINES BEFORE BUILDING PRODUCITON --------------------------- */
//    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'                              //
//    const wsUrl = `${protocol}//${window.location.host}/ws`                                              //
  const wsUrl = 'ws://192.168.1.2:8008/ws'

  console.log('[App] Connecting to WebSocket:', wsUrl)

  ws.value = new WebSocket(wsUrl)

  ws.value.onopen = () => {
    console.log('[App] WebSocket connected')
    isConnected.value = true

//    logAndSend(JSON.stringify({
//      system: 'websocket',
//      cmd: 'subscribe'
//    }))

    sendCommand({
      system: 'websocket',
      cmd: 'subscribe'
    }, "ws.value.onopen")

    flushQueue()
  }

  ws.value.onmessage = async (ev) => {
    const rawData = ev.data

    // ----------------------------
    // 1. BLOB ROUTE (ONLY PBP)
    // ----------------------------
    if (rawData instanceof Blob || rawData instanceof ArrayBuffer) {
      await handleBlob(rawData)
      return
    }

    // ----------------------------
    // 2. TEXT FRAME
    // ----------------------------
    let textData =
      typeof rawData === 'string'
        ? rawData
        : new TextDecoder().decode(rawData)

    let msg = null

    try {
      msg = JSON.parse(textData)
      if (WS_DEBUG) console.log('[← WS]', msg)
    } catch {
      handleWebSocketMessage({ data: textData })
      return
    }

    // ----------------------------
    // 3. RESULT BUS ROUTES
    // ----------------------------
    if (msg.system === 'search') {
      resultBus.emit('search', msg)
      return
    }

    if (msg.system === 'artwork') {
      resultBus.emit('artwork', msg)
      return
    }

    // ----------------------------
    // 4. ALBUM ART → BLOB HANDLER ONLY STAGING
    // ----------------------------
    if (msg.cmd === 'albumart') {
      await handleBlob(null, msg)
      return
    }

    // ----------------------------
    // 5. SUBSCRIBE ACK (optional pass-through)
    // ----------------------------
    if (
      msg.system === 'websocket' &&
      msg.cmd === 'subscribe' &&
      msg.response === 'subscribed'
    ) {
      console.log('[← WS] subscribe confirmed')
      return
    }

    // ----------------------------
    // 6. FALLBACK
    // ----------------------------
    handleWebSocketMessage({ data: textData })
  }

  ws.value.onerror = (err) => {
    console.log('[WS] error', err)
  }

  ws.value.onclose = (event) => {
    console.log('[WS CLOSED]', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })

    isConnected.value = false
    reconnectTimer.value = setTimeout(connectWebSocketRouter, 3000)
  }
}
// const connectWebSocketRouter = () => {


const handleBlob = async (rawData, msg = null) => {

  // ----------------------------
  // 1. PREFIX JSON STAGE
  // ----------------------------
  if (msg?.cmd === 'albumart') {

    art.meta = msg
    const r = msg.response || {}

    const note = msg.note || null

    // ---- NOOP ----
    if (note === 'noop') {
      return true
    }

    // ---- CLEAR ART ----
    if (note === 'noart' || r.hash === 0 || r.hash === '0') {
      if (art.url) URL.revokeObjectURL(art.url)

      art.url = null
      art.hash = null
      art.pending = null
      art.meta = null

      albumArtData.value = null
      return true
    }

    // ---- STAGE HASH + MIME ----
    if (r.hash) {
//      art.pending = String(r.hash)
      const newHash = String(r.hash)
      const oldHash = art.hash || art.pending
      if (debug) console.log('[DEBUG App] oldHash=', oldHash, 'AFTER')
      // ----------------------------
      // UI INVALIDATION (IMPORTANT)
      // ----------------------------
      if (msg.note === 'update' && (oldHash && oldHash !== newHash)) {
        albumArtData.value = null
      }

      art.pending = newHash
      art.mime = r.mime || art.mime || 'image/jpeg'

      if (debug) console.log('[DEBUG App: WS ART HASH STAGED]', art.pending)
      return true
    }

    return true
  }

  // ----------------------------
  // 2. BLOB STAGE
  // ----------------------------
  if (!(rawData instanceof Blob || rawData instanceof ArrayBuffer)) {
    return false
  }

  if (!art.pending) {
    return false
  }

  const buf = rawData instanceof Blob
    ? await rawData.arrayBuffer()
    : rawData

  const bytes = new Uint8Array(buf)

  const clientHash = fnv1a(bytes, { size: 64 }).toString()

  if ( debug ) console.log('[DEBUG App] WS ART HASH CHECK', {
    server: art.pending,
    client: clientHash,
    match: art.pending === clientHash
  })

  if (art.pending !== clientHash) {
    return true
  }

  const blob = new Blob([buf], {
    type: art.mime || art.meta?.response?.mime || 'image/jpeg'
  })

  if (art.url) URL.revokeObjectURL(art.url)

  art.url = URL.createObjectURL(blob)

  albumArtData.value = null
  requestAnimationFrame(() => {
    albumArtData.value = art.url
  })
  art.hash = art.pending
  art.pending = null

  return true
}
// const handleBlob = async (rawData, msg = null) => {


// -------------------------------
// Status / log / playlist helpers
// -------------------------------

let lastRequestStatus = 0
const requestStatus = (source = "unidentified") => {
  const now = Date.now()
  console.log("[App] requestStatus called from:", source, "@", now)
  if ( now - lastRequestStatus < requestStatusDebounce ) {
    console.log("[App] Ignoring requestStatus() call within", requestStatusDebounce, "returning")
    return
  }

  lastRequestStatus = now

  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    sendCommand("json-status")
  }
} // const requestStatus

const requestLog = () => {
  if ( debug ) console.log("[DEBUG App] requestLog invoked, viewMode=", viewMode.value)
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    if (viewMode.value === "default") {
      logLines.value = logLinesDefault
      if ( debug ) console.log("[App] requestLog requesting default log")
//      logAndSend(JSON.stringify({ system: 'mpd', cmd: 'json-log' }))
      sendCommand({ system: 'mpd', cmd: 'json-log' }, "requestLog")
    }
    else if (viewMode.value === "long" || ( viewMode.value === "log" && loglines.value != "" )) {
      if (viewMode.value === "long") {
        logLines.value = 100
      }
//      console.log("[App] logAndSend JSON, logLines=", logLines.value)
//      logAndSend(JSON.stringify({ system: 'mpd', cmd: 'json-log-stream', args: logLines.value }))
      console.log("[App] sendCommand JSON, logLines=", logLines.value)
      sendCommand({ system: 'mpd', cmd: 'json-log-stream', args: logLines.value }, "requestLog")
    }
    else {
      console.log("[App] requestLog NOT requesting", viewMode.value, "Handled elsewhere")
    }
  }
} // const requestLog

const base64urlenc = (obj) => {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
} // const base64urlenc

const base64urldec = (str) => {
  const padded = str + '='.repeat((4 - str.length % 4) % 4)

  return JSON.parse(
    atob(
      padded
        .replace(/-/g, '+')
        .replace(/_/g, '/')
    )
  )
} // const base64urldec

window.base64urlenc = base64urlenc
window.base64urldec = base64urldec

const setPlaylistCurrentN = (n) => {
  playlistCurrentN.value = Number(n) || 12
  handleAction({
    type: 'playlist_current',
    n: playlistCurrentN.value
  })
} // const setPlaylistCurrentN

const openArtwork = (path) => {
  console.log("[App] OPEN ARTWORK CALLED", path)
  if (!path) return

  artworkPath.value = path
  viewMode.value = 'artwork'

//  const payload = btoa(JSON.stringify({ path }))
    const payload = base64urlenc(JSON.stringify({ path }))


  const params = new URLSearchParams(location.search)
  params.set('view', 'artwork')
  params.set('art', payload)

  history.replaceState({}, '', `?${params}`)
} // const openArtwork


const handleStatusUpdate = (update) => {
//  console.log("[handleStatusUpate] Starting...")
  const last = lastFile.value
  const newFile = update.current.file
  const lastID = lastSongID.value
  const newSongID = update.current.songID

  playerStatusUpdate.value = Date.now()
  if (debug) console.log("[App] playerStatusUpdate:", playerStatusUpdate.value)

      player.value = update.player
     current.value = update.current
        next.value = update.next
      linger.value = update.linger

  pulse_data.value = update.pulse_data
  pauseTimer.value = update.pause_timer

  updatePauseTimer(update.pause_timer)

  let albumKey

  if (update.current.musicbrainz_albumid) {
    albumKey = update.current.musicbrainz_albumid
  } else if (newFile) {
    albumKey = newFile.split('/').slice(0, -1).join('/')
  } else if (update.current.album && update.current.albumartist) {
    albumKey = `${update.current.albumartist} -- ${update.current.album}`
  } else if (update.linger?.songid) {
    albumKey = update.linger.songid
  } else {
    albumKey = newFile
  }

// why is this albumkey and not hash?!?!
// THIS FORCES A PULL OF ARTWORK AT STARTUP AND ALBUMKEY IS NOT HOW WE SHOULD BE TRACKING NOW!

//if (albumKey !== lastAlbumKey.value) {
//  lastAlbumKey.value = albumKey
//  refreshAlbumArt(newFile)
//}


//  the gobe seens to be doing the log push so this is duplicated log pulls:
//  2026-06-25T23:09-04:00  remove eventually
//  
//  if ((newFile && newFile !== last) || (newSongID != null && newSongID !== lastID)) {
//    if (newFile && newFile !== last) lastFile.value = newFile
//    if (newSongID != null && newSongID !== lastID) lastSongID.value = newSongID
//
//    if (initialLoadDone) {
//      console.log("[App] handleStatusUpdate calling requestLog()")
//      requestLog()
//    } else initialLoadDone = true
//  }

//  console.log("[handleStatusUpate] Returning...")
  return

} // handleStatusUpdate





////////////////////////////////////////////////////////////////
//  PERIODIC REFRESH BLOCK:                                   //
////////////////////////////////////////////////////////////////
//    // Optional: periodic status refresh every N ms         //
//    const statusInterval = setInterval(() => {              //
//      requestStatus()                                       //
//    }, 5000) // 5s is reasonable for cheap requests         //
////////////////////////////////////////////////////////////////

const handleWebSocketMessage = async (event) => {
  const raw = event.data

  if ( debug ) {
    console.log('[WS RAW TYPE]', typeof raw)
    console.log('[WS RAW HEAD]', raw.slice(0, 80))
  }

  // ----------------------------
  // 1. ALWAYS TRY JSON FIRST
  // ----------------------------
  let data = null

  try {
    data = JSON.parse(raw)
  } catch (_) {
    data = null
  }

  // ----------------------------
  // 2. ARRAY PAYLOAD (logs batch)
  // ----------------------------
  if (Array.isArray(data)) {
    if (data.length && data[0]?.timestamps && data[0]?.action) {
      logEntries.value = data.slice(0, logLines.value)
      return
    }

    console.warn('[WS ARRAY] unhandled array payload:', data)

    return
  }

  // ----------------------------
  // 3. OBJECT PAYLOAD
  // ----------------------------
  if (data && typeof data === 'object') {

    // -------------------------------
    // SUBSCRIBE RESPONSE ROUTER
    // -------------------------------
    if ( data &&
         (data.system === "websocket" || data.system === "subscribed") &&
         (data.cmd === "subscribe" || data.cmd === "json-status" )
       )
    {

      let subscribe = "SUBSCRIBED"
      if (data.system === "websocket") subscribe = "SUBSCRIBE"
      // 1. SUBSCRIBE ACK
      if (data.response === "subscribed") {
        console.log("[", subscribe, "] confirmed")
        return
      }

      // 2. STATUS UPDATE (player / current / next)
      if (data.response && data.response.player && data.response.current) {
        if ( debug ) console.log("[", subscribe, "] status frame")

//        // playerStatusUpdate must be executed for **every** valid player snapshot, not only when values differ.
//        // this is required for the progress circle and elapsed timer to update properly.
//        // NB: while it does say **every**, it doesn't handle the response to `json-status` which doesn't come
//        // back as a wrapped response.
//
//        playerStatusUpdate.value = Date.now()
//        if (debug) console.log("[App] playerStatusUpdate:", playerStatusUpdate.value)
//
//        player.value = data.response.player
//        current.value = data.response.current
//        next.value = data.response.next
//        linger.value = data.response.linger
//
//        pulse_data.value = data.response.pulse_data
//        pauseTimer.value = data.response.pause_timer
//
//        updatePauseTimer(data.response.pause_timer)

        handleStatusUpdate(data.response)
//        console.log("[", subscribe,"] status frame returning...")
        return
      }

      // 3. LOG FRAME (timestamps)
      if (Array.isArray(data.response)) {
        const looksLikeLogs = data.response.length &&
          data.response[0]?.timestamps &&
          data.response[0]?.action

        if (looksLikeLogs || data.cmd === "json-log") {
          console.log("[SUBSCRIBE] log batch:", data.response.length)
          logEntries.value = data.response.slice(0, logLines.value)
          return
        }
      }

  //  // 4. ARTWORK META (NO BLOB HERE)
  //  if (data.response && data.response.hash) {
  //    console.log("[SUBSCRIBE] artwork meta:", data.response)
  //
  //    // store meta only
  //    albumArtMeta.value = {
  //      hash: data.response.hash,
  //      mime: data.response.mime,
  //      size: data.response.size,
  //      width: data.response.width,
  //      height: data.response.height
  //    }
  //
  //    return
  //  }

      if (data.response && data.response.hash) {
        const r = data.response

        art.hash = r.hash
        art.note = r.note

        // HARD RESET
        if (r.note === "noart") {
          art.hash = null
          art.pending = null
          albumArtData.value = null
          return
        }

        if (r.note === "update") {
          console.log('[App] BEFORE art.pending=', art.pending)
          art.pending = r.hash
          console.log('[App] AFTER art.pending=', art.pending)
          return
        }

        if (r.note === "noop") {
          if (art.hash && art.hash !== r.hash) {
            requestAlbumArt(current.value?.file)
          }
          return
        }

        return
      }
    }

//  // -------------------------------
//  // BINARY FRAME (album art blob)
//  // -------------------------------
//  if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
//    console.log("[WS] binary frame received (album art)")
//
//    albumArtBlob.value = event.data
//
//    // optional: immediate render hook
//    // refreshAlbumArtFromBlob(event.data)
//
//    return
//  }

    // ---- log batch (json-log)
    if (data.cmd === 'json-log' && Array.isArray(data.response)) {
      if ( debug ) console.log('[DEBUG App] ---- log batch (json-log) recieved')
      logEntries.value = data.response.slice(0, logLines.value)
      return
    }

    // ---- status
    if (data.status || data.song) {
//      status.value = data.status || status.value
      console.log('---------------[PLAYER WRITE #2]----------------')
      console.log('--------------INVESTIGATE TRIGGER---------------')
      player.value = data.player || player.value
      current.value = data.song || current.value
      return
    }

    // ---- mpd / playlist / system block
    if (data.system && data.cmd && data.response !== undefined) {

      if (
        data.system === "mpd" &&
        data.cmd === "delete" &&
        data.response === "ok" &&
        data.deleted > 0 &&
        viewMode.value === 'search'
      ) {
        resultBus.emit("playlistChanged")
        return
      }

      if (data.system === 'playlist' && data.cmd === 'playlist') {
        if (!Array.isArray(data.response)) {
          console.error('[PLAYLIST] invalid response:', data.response)
          return
        }

        if (viewMode.value === 'current') {
          playlistCurrentSongs.value = data.response
        }

        if (viewMode.value === 'album') {
          playlistAlbumSongs.value = data.response
        }

        return
      }

      if (data.system === 'playlist' && data.cmd === 'changed') {
        resultBus.emit('playlistChanged', data.response)
        return
      }

      if (data.system === 'mpd' && data.cmd === 'ignore') {
        addNotification(
          data.response !== 'error'
            ? `Ignored: ${data.response}`
            : `Ignored: ${data.error}`
        )
        return
      }

      if (data.system === 'pulseaudio' && data.cmd === 'set_volume') {
        pulse_data.value.volume = data.response
        return
      }

      if (data.system === 'pulseaudio' && data.cmd === 'changed') {
        pulse_data.value.volume = data.response.volume
        pulse_data.value.mute = data.response.mute
        return
      }

      return
    }

    /* ---- player state (heavy block)
    /  This handles the bare json-status response which does not include
    /  the e.g., {"system:"subscribed", "cmd":"json-status", "response":"[]"}'
    /  json form.  if/when the GoBE includes a proper handler for a json-based
    /  status request (e.g., '{"system":"player", "cmd":"json-status"}' this can
    /  be eliminated.  
    /  See also: https://github.com/iconoclasthero/mpdgolinger/issues/32
    */
    if (data.player && data.current) {
//      console.log('[PLAYER WRITE #3] Calling handleStatusUpdate...')

//      const last = lastFile.value
//      const newFile = data.current.file
//
////      status.value = { player: data.player }
//
//      player.value = data.player
//      current.value = data.current
//      next.value = data.next
//      linger.value = data.linger
//      pulse_data.value = { ...data.pulse_data }
//      pauseTimer.value = data.pause_timer
//
//      updatePauseTimer(data.pause_timer)
//
//      let albumKey
//
//      if (data.current.musicbrainz_albumid) {
//        albumKey = data.current.musicbrainz_albumid
//      } else if (newFile) {
//        albumKey = newFile.split('/').slice(0, -1).join('/')
//      } else if (data.current.album && data.current.albumartist) {
//        albumKey = `${data.current.albumartist} -- ${data.current.album}`
//      } else if (data.linger?.songid) {
//        albumKey = data.linger.songid
//      } else {
//        albumKey = newFile
//      }
//
//// why is this albumkey and not hash?!?!
//// THIS FORCES A PULL OF ARTWORK AT STARTUP AND ALBUMKEY IS NOT HOW WE SHOULD BE TRACKING NOW!
//
////if (albumKey !== lastAlbumKey.value) {
////  lastAlbumKey.value = albumKey
////  refreshAlbumArt(newFile)
////}
//
//
//      if (newFile && newFile !== last) {
//        lastFile.value = newFile
//
//        if (initialLoadDone) requestLog()
//        else initialLoadDone = true
//      }
//
//      return

      if (data) handleStatusUpdate(data)
      else console.log("No data on hand to call hanleStatusUpdate! Investigate!")

//      console.log("[PLAYER WRITE #3] Returning...")
      return
    }

    // ---- timestamp log stream (single object)
    if (data.timestamps && data.action) {
      logBuffer.push(data)

      if (!logFlushTimer) {
        logFlushTimer = setTimeout(() => {
          logEntries.value.push(...logBuffer)
          if (logEntries.value.length > logLines.value) {
            logEntries.value = logEntries.value.slice(0, logLines.value)
          }
          logBuffer.length = 0
          logFlushTimer = null
        }, 50)
      }

      return
    }

    console.warn('[WS OBJECT] unhandled payload:', data)
    return
  }

  // ----------------------------
  // 4. STRING PAYLOAD fallback
  // ----------------------------
  console.warn('[WS STRING] non-json payload:', raw)
} // const handleWebsocketMessage


// -------------------------------
// Requests
// -------------------------------

// -------------------------------
// Outgoing commands
// -------------------------------

const sendCommand = (cmd, source = "unknown") => {
  if ( typeof cmd !== 'object' && typeof cmd !== 'string' || cmd == null ) {
    console.error("[App] sendCommand received an illegal cmd inpug:", cmd)
    return
  }

  let command = cmd
  let callRequestStatus = true

  if (typeof cmd === 'object') {
    command = JSON.stringify(cmd)
  }

  if ( command.includes('json-status') ) {
    callRequestStatus = false
  }

  if (! WS_DEBUG) console.log('→ Sending WebSocket:', command)

  if (WS_DEBUG && command !== 'json-status' ){
    console.log('[→ WS]', command)
  }

  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(command)
    if ( callRequestStatus ) {
      setTimeout(() => requestStatus(source), requestStatusDelay)
    }
  } else {
    console.info('[App] WebSocket not connected, enqueuing command:', command)
    enqueue(command)
  }
} // const sendCommand


// These were replaced 2026-06-25T23:23-04:00
// To be deleted after testing
//const sendCommand = (cmd) => {
//  logAndSend(cmd)
//  if (cmd !== 'json-status' && !cmd.includes('json-status')) {
//    setTimeout(requestStatus("logAndSend"), requestStatusDelayLogSend)
//  }
//} // const sendCommand
//
//const sendWebSocketCommand = (cmdObj) => {
//  logAndSend(JSON.stringify(cmdObj))
//  console.log("[App] sendWebSocketCommand, cmdObj:", cmdObj)
//} // const sendWebSocketCommand

// -------------------------------
// Action handler @ App.vue
// -------------------------------
const handleAction = (action) => {
  if ( debug ) console.log('[DEBUG App] handleAction:', action)

  if ( action == 'viewDefault' ) {
    console.log('[App] Action viewDefault received')
    viewMode.value = 'default'
    logLines.value = logLinesDefault
    requestLog()
    return
  }

  if (action == 'viewLong') {
    console.log('[App] Action viewLong received')
    viewMode.value = 'long'
    requestLog()
    return
  }

  if (typeof action === 'object') {

    if ( action.type === 'add-log-entry-next' ) {
      if ( debug ) {
        console.log('[DEBUG App] Action add-log-entry-next received')
        console.log('[DEBUG App] payload:', action.payload)
      }
      sendCommand(
        { system: 'mpd',
             cmd: 'add',
            args: [{ uri: action.payload, pos: "+0" }]
        }, "add-log-entry-next"
      )
      sendCommand(
        { system: 'mpd',
             cmd: 'random',
            args: 0
        }, "add-log-entry-next"
      )
     return
    }


    if (action.type === 'ignore-log-entry') {
      console.log('[App] Ignoring log entry:', action.payload)
      sendCommand({
        system: 'mpd',
        cmd: 'ignore',
        args: action.payload
      }, "handleAction")
      return
    }


    if (action.type === 'pause_timer_on') {
      const sec = (Number(action.min) || 0) * 60
      if (sec <= 0) return
      sendCommand({
        system: 'pause_timer',
        cmd: 'on',
        args: sec
      }, "handleAction")
      return
    }

    if (action.type === 'pause_timer_off') {
      sendCommand({
        system: 'pause_timer',
        cmd: 'off'
      }, "handleAction")
      return
    }

    if (action.system === 'pulseaudio' && action.cmd === 'set_volume') {
      sendCommand(action, "handleAction")
      return
    }

    if (action.type === 'playlist_album' || action.type === 'playlist_current') {
      let args
      console.log(`[App] Action Object: ${action.type} received`)
      const view = action.type.replace(/^playlist_/, '')
      changeView(view)
      if ( view === 'album') {
        args = 'album'
      } else if ( view === 'current') {
        args = { current: action.n ?? playlistCurrentN.value }
      }
      sendCommand({
        system: 'playlist',
        cmd: 'playlist',
        args: args,
      }, "handleAction")
      return
    }

    if (action.type === 'playPosition') {
      sendCommand({
        system: 'player',
        cmd: 'play',
        args: action.pos
      }, "handleAction")
      return
    }

    if (action.type === 'open_pause_timer') {
      console.log('[App] action.type: open_pause_timer')
      activeTab.value = 'timer'
      showPanel.value = true
      return
    }

  }

  const map = {
    fix_art:          JSON.stringify({ system:'mpd',         cmd:'albumart',   args:'fix_art' }),
    toggle_playback:  JSON.stringify({ system:'player',      cmd:'togglestate'                }),
    resume_playback:  JSON.stringify({ system:'player',      cmd:'resume'                     }),
    pause_playback:   JSON.stringify({ system:'player',      cmd:'pause'                      }),
    prev_track:       JSON.stringify({ system:'mpd',         cmd:'previous'                   }),
    next_track:       JSON.stringify({ system:'mpd',         cmd:'next'                       }),
    reset_track:      JSON.stringify({ system:'mpd',         cmd:'restart'                    }),
    enable_random:    JSON.stringify({ system:'mpd',         cmd:'random',     args:'1'       }),
    disable_random:   JSON.stringify({ system:'mpd',         cmd:'random',     args:'0'       }),
    toggle_random:    JSON.stringify({ system:'mpd',         cmd:'togglerandom'               }),
    enable_consume:   JSON.stringify({ system:'mpd',         cmd:'consume',    args:'1'       }),
    disable_consume:  JSON.stringify({ system:'mpd',         cmd:'consume',    args:'0'       }),
    toggle_consume:   JSON.stringify({ system:'mpd',         cmd:'toggleconsume'              }),
    toggle_single:    JSON.stringify({ system:'mpd',         cmd:'togglesingle'               }),
    toggle_repeat:    JSON.stringify({ system:'mpd',         cmd:'togglerepeat'               }),
    ignore:           JSON.stringify({ system:'mpd',         cmd:'ignore'                     }),
    start_mpdzmq:     JSON.stringify({ system:'mpd',         cmd:'start_mpdzmq'               }),
    DOWN_VOLUME:      JSON.stringify({ system:'pulseaudio',  cmd:'set_volume', args:"-5"      }),
    down_volume:      JSON.stringify({ system:'pulseaudio',  cmd:'set_volume', args:"-1"      }),
    up_volume:        JSON.stringify({ system:'pulseaudio',  cmd:'set_volume', args:"+1"      }),
    UP_VOLUME:        JSON.stringify({ system:'pulseaudio',  cmd:'set_volume', args:"+5"      }),
    mute_volume:      JSON.stringify({ system:'pulseaudio',  cmd:'mute_volume'                }),
    pause_timer_end:  JSON.stringify({ system:'pause_timer', cmd:'end'                        }),
//  pause_timer_on:   JSON.stringify({ system:'pause_timer', cmd:'on', args:'pauseTimerDur'   }),
//  pause_timer_off:  JSON.stringify({ system:'pause_timer', cmd:'off'                        }),
    linger_next:      JSON.stringify({ system:'linger',      cmd:'next'                       }),
    linger_start:     'linger-start',
    linger_toggle:    JSON.stringify({ system:'linger',      cmd:'toggle'                     }),
    toggle_output:    'toggle-output',
    json_status:      'json-status'
  }
  if (map[action]) {
    if ( debug ) console.log('[DEBUG App] sending:', map[action])
    sendCommand(map[action], "handleAction: map")
  }
}

// const changeView = (mode) => { viewMode.value = mode }
const changeView = (mode) => {
  if ( debug ) console.log('[DEBUG App] changeView called:', mode)
  viewMode.value = mode

  const params = new URLSearchParams(location.search)
  params.set('view', mode)

  history.replaceState({}, '', `?${params.toString()}`)
}

let statusLock = false

const handleVisibilityChange = () => {
  if (!document.hidden && isConnected.value) {
    if (statusLock) {
      console.log("[App] Return from hVC() because statusLock within", requestStatusDebounce, "ms")
      return
    }
    statusLock = true

    requestStatus("handleVisibilityChange")

    setTimeout(() => {
      statusLock = false
    }, requestStatusDebounce)
    // Only refresh art if track changed (status response will handle it)
  }
}

const handleFocus = () => {
  if (isConnected.value) {
    if (statusLock) {
      if ( debug ) {
        console.log("[DEBUG App] Return from hF() because statusLock within", handleFocusDebounce, "ms")
      }
      return
    }

    if ( debug ) console.log('[DEBUG App] handleFocus triggered → requesting status')
    statusLock = true
    console.log("[App] handlefocus statusLock:", statusLock)
    requestStatus("handleFocus")

    setTimeout(() => {
      statusLock = false
    }, handleFocusDebounce)
    // requestLog() removed here to prevent extra first-load log
    // Only refresh art if track changed (status/log response will handle it)
  }
}

//const handleVisibilityChange = (event) => {
//  // 1. Guard clause: Ensure connection exists
//  if (!isConnected.value) return;
//
//  // 2. Guard clause: If it is a visibility event, ignore it if the page is hidden
//  if (event?.type === 'visibilitychange' && document.hidden) return;
//
//  // 3. Optional debug log
//  console.log('[DEBUG App] Activation triggered → requesting status');
//
//  // 4. Fire the request
//  requestStatus();
//};


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
    console.log("[App] readyState:", ws.value.readyState)
    console.log("[App] → [WS] Sent blocklimit:", n)
  } else {
    console.error("[App] WebSocket not connected")
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


const refreshAlbumArt = (file = null) => {
  const target = file || current.value?.file
  if (!target) return

  if (debug) console.log('[DEBUG App] refreshAlbumArt target:', target)
  console.log('[App] refreshAlbumArt target:', target)

//  logAndSend(
//    JSON.stringify({
//      system: 'mpd',
//      cmd: 'albumart',
//      args: target
//    })
//  )

  sendCommand({
    system: 'mpd',
    cmd: 'albumart',
    args: target
  }, "refreshAlbumArt")
}

// Unified keydown handler
const handleKeydown = (ev) => {
  const key = ev.key.toLowerCase()

  // Alt+A → toggle artwork view
  if (ev.altKey && key === 'a') {
    ev.preventDefault()

//    viewMode.value =
//      viewMode.value === 'artwork'
//        ? 'default'
//        : 'artwork'
    if (viewMode.value === 'artwork') {
      viewMode.value = 'default'
    } else {
      artworkPath.value = current?.value?.file
        ?.replace(/\/[^/]+$/, '')

      viewMode.value = 'artwork'
    }
  }

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

/* ----------- Notifications --------------- */

const notifications = ref([])

const addNotification = (msg, duration = 8000) => {
  console.log("[App] msg:", msg)
  const id = Date.now()
  notifications.value.push({ id, msg })
  setTimeout(() => {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1) notifications.value.splice(idx, 1)
  }, duration)
}

/* ----------- Notifications --------------- */

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
  connectWebSocketRouter()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleFocus)
//  window.addEventListener('scroll', handleScroll)

  // --- attach keydown listener for multiple shortcuts ---
  window.addEventListener('keydown', handleKeydown)

  if (viewMode.value === 'album') {
    handleAction({ type: 'playlist_album' })
  }

  let chk = setInterval(() => {
    const el = document.querySelector('.album.desktop')
    if ( debug ) console.log('[DEBUG App] MENU RETRY:', !!el)

    if (el) {
      const r = el.getBoundingClientRect()
      menuLeft.value = r.left + r.width * 1.5
      clearInterval(chk)
    }
  }, 50)

  const params = new URLSearchParams(location.search)

  if (params.get('view') === 'artwork') {
    try {
//      const decoded = JSON.parse(atob(params.get('art')))
      const decoded = base64urldec(params.get('art'))
      artworkPath.value = decoded.path
    } catch (err) {
      console.error('bad artwork payload', err)
    }
  }
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

.notification-container {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 500px;
  z-index: 1000;
}

.notification {
  background: #ff4444;
  color: white;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  font-weight: bold;
}
</style>
