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
      :elapsed="status.player.elapsed"
      :duration="status.player.duration"
      :color="ringColor"
      :playing="status.player.state==='play'"
      img-src="/android-icon-96x96.png"
      @seek="seekTo"
      @action="handleAction"
  />
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


    <!-- Progress Circle -->
<!--
    <ProgressCircle
      v-if="status"
      :status="status"
      :elapsed="status.player.elapsed"
      :duration="status.player.duration"
      :color="ringColor"
      :playing="status.player.state==='play'"
      img-src="/android-icon-96x96.png"
      @seek="seekTo"
    />
-->
    <!-- Currently Playing Section -->
    <CurrentlyPlaying 
      v-if="status"
      :status="status"
      :current="current"
      :next="next"
      :linger="linger"
      :send-command="sendWebSocketCommand"
      :showPath="showPath"
      @action="handleAction"
    />

    <!-- Album Art -->
    <AlbumArt 
      v-if="current"
      :artist="current.artist"
      :album-art-data="albumArtData"
      :mbArtistID="current.musicbrainz_artistid"
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

<!-- <button id="backTop" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 12px;
  background: #0af;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: none;
">↑ Top</button> 

<button
  v-show="showBackTop"
  @click="goTop"
  style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 18px 12px;
/*    background: #007bff; */
    background: #d94031; */
    background: #d73e30;
    color: #fff;
    border: none;
    border-radius: 90px;
    cursor: pointer;
  "
>
  ↑ Top
</button> -->

    <!-- Back-to-Top Button -->
    <BackToTop :show="showBackTop" />

<ControlPanel
  :visible="showPanel"
  :linger="linger"
  :playlistCurrentN="playlistCurrentN"
  @update:playlistCurrentN="val => playlistCurrentN = val"
  @update-current-window="setPlaylistCurrentN"
  @cmd="sendWebSocketCommand"
  @close="showPanel = false"
/>
  </div>

</template>

<script>
import { ref, onMounted, onUnmounted, provide } from 'vue'
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

export default {
  name: 'App',
  components: { ProgressCircle, CurrentlyPlaying, AlbumArt, NextTrack, LogSection, PlaylistAlbum, PlaylistCurrent, NavButtons, BackToTop, ControlPanel, SearchView },
  setup() {
    const WS_DEBUG = false
    const ws = ref(null)
    const isConnected = ref(false)
    const status = ref(null)
    const current = ref(null)
    const next = ref(null)
    const linger = ref(null)
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
    const ringColor = ref('#d73e30')
    const logBuffer = []
    const playlistCurrentN = ref(12)   // the +/- around current playlist so that number of songs is (2*n)+1, e.g., grep -C<n>
    const playlistCurrentSongs = ref([])
    const playlistAlbumSongs = ref([])
    const logLinesDefault = 24
//    const logLines = ref(24)
    const logLines = ref(logLinesDefault)

    let logFlushTimer = null

    // NEW FLAG TO PREVENT INITIAL LOG REQUEST
    let initialLoadDone = false

    provide('isConnected', isConnected)

    // -------------------------------
    // Command Bus for components
    // -------------------------------
/*    const cmdBus = {
      send(msg) {
        ws.value.send(JSON.stringify(msg))
      }
    }
*/
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

      const wsUrl = 'ws://192.168.1.2:8008/ws'
//    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
//    const wsUrl = `${protocol}//${window.location.host}/ws`
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
          const blob = ev.data instanceof Blob ? ev.data : new Blob([ev.data])
          if (albumArtData.value?.startsWith('blob:')) URL.revokeObjectURL(albumArtData.value)
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
      //  console.log('WebSocket disconnected')
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
        if (data.system === 'player' && data.cmd === 'playlist') {
          console.log('playlist response received for viewMode:', viewMode.value, data.response)
        }
        if (data.system === 'player' && data.cmd === 'playlist') {
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
      }


      if (data.player && data.current) {
        const last = lastFile.value
        const newFile = data.current.file

        status.value = { player: data.player }
        current.value = data.current
        next.value = data.next
        linger.value = data.linger

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

//      if (data.timestamps && data.action) {
//        logEntries.value.push(data)
//        if (logEntries.value.length > 24) logEntries.value = logEntries.value.slice(-24)
//      }


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
      setTimeout(requestStatus, 100)
    }

    const sendWebSocketCommand = (cmdObj) => {
      logAndSend(JSON.stringify(cmdObj))
    }

    // -------------------------------
    // Action handler @ App.vue
    // -------------------------------
    const handleAction = (action) => {

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

      if (action === 'playlist_album') {
        console.log('Action playlist_album received')
        viewMode.value = 'album'
        sendCommand(JSON.stringify({
          system: 'player',
          cmd: 'playlist',
          args: 'album'
        }))
        return
      }

      if (action === 'playlist_current') {
        sendCommand(JSON.stringify({
          system: 'player',
          cmd: 'playlist',
          args: { current: playlistCurrentN.value ?? playlistCurrentN.value }
        }))
        viewMode.value = 'current'
        return
      }

      if (typeof action === 'object') {
        if (action.type === 'playlist_album') {
          console.log('Action Object: playlist_album received')
          viewMode.value = 'album'
          sendCommand(JSON.stringify({
            system: 'player',
            cmd: 'playlist',
            args: 'album'
          }))
          return
        }

        if (action.type === 'playlist_current') {
          viewMode.value = 'current'
          sendCommand(JSON.stringify({
            system: 'player',
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
        next_track: JSON.stringify({ system:'mpd', cmd:'next' }),
        reset_track: JSON.stringify({ system:'mpd', cmd:'restart' }),
        enable_random: JSON.stringify({ system:'mpd', cmd:'random', args:'1' }),
        disable_random: JSON.stringify({ system:'mpd', cmd:'random', args:'0' }),
        toggle_random: JSON.stringify({ system:'mpd', cmd:'togglerandom' }),
        enable_consume: JSON.stringify({ system:'mpd', cmd:'consume', args:'1' }),
        disable_consume: JSON.stringify({ system:'mpd', cmd:'consume', args:'0' }),
        toggle_consume: JSON.stringify({ system:'mpd', cmd:'toggleconsume' }),
        toggle_single: JSON.stringify({ system:'mpd', cmd:'togglesingle' }),
        toggle_repeat: JSON.stringify({ system:'mpd', cmd:'togglerepeat' }),
        ignore: JSON.stringify({ system:'mpd', cmd:'ignore' }),
        up_volume: JSON.stringify({ system:'pulseaudio', cmd:'up_volume'}),
        down_volume: JSON.stringify({ system:'pulseaudio', cmd:'down_volume'}),
        mute_volume: JSON.stringify({ system:'pulseaudio', cmd:'mute_volume'}),
        toggle_output: 'toggle-output',
        linger_start: 'linger-start',
        linger_next: JSON.stringify({ system:'linger', cmd:'next' }),
        linger_toggle: 'toggle',
        json_status: 'json-status'
      }
      if (map[action]) sendCommand(map[action])
    }

    const changeView = (mode) => { viewMode.value = mode }


//  function showAlbumPlaylist() {
//    viewMode.value = 'album'
//  }
//
//  function showCurrentPlaylist() {
//    viewMode.value = 'window'
//  }
//
//  function showLog() {
//    viewMode.value = 'log'
//  }


    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected.value) {
        requestStatus()
        // Only refresh art if track changed (status response will handle it)
      }
    }

    const handleFocus = () => {
      if (isConnected.value) {
        console.log('handleFocus triggered → requesting status')
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

    const seekTo = (seconds) => {
      const payload = {
        system: "mpd",
        cmd: "seek",
        args: Math.floor(seconds)
      }

      ws.value.send(JSON.stringify(payload))
    }

//    const handleKeydown = (ev) => {
//      // Alt+B → blocklimit modal
//      if (ev.altKey && ev.key.toLowerCase() === 'b') {
//        ev.preventDefault()
//        blockLimitPrompt()
//      }
//    }

//    const handleScroll = () => {
//      showBackTop.value = window.scrollY > 100
//    }

    const goTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const refreshAlbumArt = (file) => {
      logAndSend(JSON.stringify({ system: 'albumart', cmd: 'get', args: file }))
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

//    onMounted(() => {
//      connectWebSocket()
//      document.addEventListener('visibilitychange', handleVisibilityChange)
//      window.addEventListener('focus', handleFocus)
//
//      // --- attach keydown listener ---
//      window.addEventListener('keydown', handleKeydown)
//      window.addEventListener('scroll', handleScroll)
//    })
//
//    onUnmounted(() => {
//      ws.value?.close()
//      if (reconnectTimer.value) clearTimeout(reconnectTimer.value)
//      document.removeEventListener('visibilitychange', handleVisibilityChange)
//      window.removeEventListener('focus', handleFocus)
//
//      // --- detach keydown listener ---
//      window.removeEventListener('keydown', handleKeydown)
//    })

onMounted(() => {
  connectWebSocket()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleFocus)
//  window.addEventListener('scroll', handleScroll)

  // --- attach keydown listener for multiple shortcuts ---
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  ws.value?.close()
  if (reconnectTimer.value) clearTimeout(reconnectTimer.value)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleFocus)
  window.removeEventListener('scroll', handleScroll)

  // --- detach keydown listener ---
  window.removeEventListener('keydown', handleKeydown)
})



    return {
      status, current, next, linger, logEntries, viewMode, albumArtData, 
      handleAction, changeView, sendWebSocketCommand, blockLimitPrompt, 
      showBackTop: true, goTop, showPanel, showPath, ringColor, seekTo,
      playlistCurrentN, playlistCurrentSongs, playlistAlbumSongs, setPlaylistCurrentN
    }
  }
}
</script>
