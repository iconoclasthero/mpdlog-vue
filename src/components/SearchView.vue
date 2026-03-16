<template>
<div class="search">

  <!-- controls -->

  <div class="search-controls">

    <label>
      <input type="radio" v-model="mode" value="playlist">
      playlist
    </label>

    <label>
      <input type="radio" v-model="mode" value="database">
      database
    </label>

    <label>
      <input type="radio" v-model="mode" value="list">
      list
    </label>

    <label class="sliderbox">
      Aa
      <input type="checkbox" v-model="caseSensitive">
      <span class="slider"></span>
    </label>

    <label class="sliderbox">
      fzf
      <input type="checkbox" v-model="fzfMode">
      <span class="slider"></span>
    </label>

    <button @click="runSearch">
      enter
    </button>

    <span class="helpicon" @click="showHelp=true">?</span>

  </div>


  <!-- multiline query -->

  <textarea
    v-model="query"
    style="background-color: #383838; color: white;"
    rows="5"
    class="searchbox"
    placeholder='Artist="Bob Dylan"
OR
Album=Infidels'
    @keydown="keyHandler"
  />


  <!-- results -->

  <div class="results">

<!--
    <button @click="toggleAll">
      toggle all
    </button>
-->
    <input type="checkbox" @change="toggleAll"> &nbsp;toggle all

    <div class="search-results">
      <div v-for="album in grouped" :key="album.key" class="album-group">

        <div class="album-header">

          <button
            class="collapse"
            @click="toggleAlbum(album.key)"
          >
            {{ collapsed.has(album.key) ? '+' : '−' }}
          </button>

          <input
            type="checkbox"
            :checked="albumSelected(album)"
            @change="toggleAlbumSelection(album)"
          />

          <span class="artist">{{ album.artist }}</span>
          <span class="sep">—</span>
          <span class="album">{{ album.album }}</span>

          <span class="count">
            ({{ album.tracks.length }})
          </span>

        </div>


        <div v-if="!collapsed.has(album.key)">
<!--
          <div
            v-for="track in album.tracks"
            :key="track.file"
            class="track-row"
          >
-->
          <div
            v-for="track in album.tracks"
            :key="mode === 'playlist' ? track.song_position : track.file"
            class="track-row"
          >

            <input
              type="checkbox"
              :checked="selected.has(track.file)"
              @change="toggle(track.file)"
            />
            <span v-if="mode === 'playlist'" class="trackno">
              ({{ String(track.song_position).padStart(posWidth, '0') }})

<!--              ({{ track.song_position }}) -->
            </span>

            <span class="trackno">
              {{ track.track }}
            </span>
<!--
            <span class="title">
              {{ track.title }}
            </span>
-->
            <span class="title" @click="play(track.song_position)">
              {{ track.title }}
              <span v-if="isVA(track)"> – {{ track.artist }}</span>
            </span>

          </div>


          <div
            v-if="showPath"
            v-for="track in album.tracks"
            :key="track.file + '-path'"
            class="album file-path"
          >
            <a
              style="text-decoration:none; display:inline-block;"
              :href="'mpdlog://open?path=' + encodeURIComponent(track.file)"
            >
              {{ track.file }}
            </a>
          </div>

        </div>
        <hr>
      </div>

      <div class="action-buttons">

        <button @click="addSelected">
          Add
        </button>

        <button @click="deleteSelected">
          Delete
        </button>

        <button @click="ignoreSelected">
          Ignore
        </button>

      </div>

    </div>

  </div>


  <!-- help modal -->

  <div
    v-if="showHelp"
    class="helpoverlay"
    @click.self="showHelp=false"
  >

    <div class="helpmodal">

      <button
        class="close"
        @click="showHelp=false"
      >
        ×
      </button>

      <div
        class="markdown"
        v-html="helpHtml"
      ></div>

    </div>

  </div>

</div>
</template>



<script setup>

import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import { tokenize, parseQuery } from '@/utils/searchParser.js'
window.parseQuery = parseQuery
window.tokenize = tokenize
import MarkdownIt from "markdown-it"
import doc from '@/assets/searchdocs.md?raw'

const props = defineProps({
  showPath:Boolean
})

const cmdBus = inject('cmdBus')
const resultBus = inject('resultBus')
const isConnected = inject('isConnected')


/* markdown help */
const md = new MarkdownIt({
  html:false,
  linkify:true,
  typographer:true
})

const helpHtml = md.render(doc)
const showHelp = ref(false)


/* state */
const query = ref('')
const results = ref([])
const selected = ref(new Set())
const collapsed = ref(new Set())
const posWidth = ref(1) // position width (max number of digits)

/* search controls */
const mode = ref('playlist')
const caseSensitive = ref(false)
const fzfMode = ref(false)


/* history */
const history = ref([])
let historyIndex = -1


/* debounce disabled */
/*
let debounceTimer = null
watch(query, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch,1000)
})
*/


/* search id tracking */
let searchId = 0
let activeSearch = 0


/* websocket handler */
resultBus.on('search', msg => {
  if(msg.meta?.searchId !== activeSearch)
    return
  mergeResults(msg.response)
})


/* command selection */

function cmd(){
  if(mode.value === 'playlist')
    return caseSensitive.value ? 'playlistfind' : 'playlistsearch'
  if(mode.value === 'database')
    return caseSensitive.value ? 'find' : 'search'
  if(mode.value === 'list')
    return 'list'
}


/* run search */

function runSearch(){
  if(!isConnected?.value){
    console.log('[SearchView] WS not connected')
    return
  }

  const q = query.value.trim()
  if(!q) return

  searchId++
  const thisSearch = searchId
  activeSearch = thisSearch

  results.value = []

  const groups = parseQuery(q)

  groups.forEach(g => {
    console.log("SEARCH CONDS", JSON.stringify(g,null,2))
    cmdBus.send({
      system:'search',
      cmd:cmd(),
      args:{ conds:g },
      meta:{ searchId:thisSearch }
    })
  })

if(history.value[0] !== query.value)
  history.value.unshift(query.value)
  historyIndex = -1
}


/* keyboard handling */
function keyHandler(e){
  if(e.key==='Enter' && !e.shiftKey){
    e.preventDefault()
    runSearch()
  }
  if(e.key==='ArrowUp'){
    if(historyIndex+1 < history.value.length){
      historyIndex++
      query.value = history.value[historyIndex]
    }
  }
  if(e.key==='ArrowDown'){
    if(historyIndex>0){
      historyIndex--
      query.value = history.value[historyIndex]
    }
  }
}


/* merge OR results */
//function mergeResults(r){
//  const seen = new Set(results.value.map(x=>x.file))
//  r.forEach(row=>{
//    if(!row.file) return
//    if(!seen.has(row.file)){
//      seen.add(row.file)
//      results.value.push(row)
//    }
//  })
//}

function mergeResults(r){

  const seen = new Set(
    results.value.map(x =>
      mode.value === 'playlist'
        ? x.song_position
        : x.file
    )
  )

  r.forEach(row=>{

    const key =
      mode.value === 'playlist'
        ? row.song_position
        : row.file

    if(key == null) return

    if(!seen.has(key)){
      seen.add(key)
      results.value.push(row)
    }

  })

  /* compute playlist position width once */
  if(mode.value === 'playlist'){
    posWidth.value = Math.max(
      ...results.value.map(x => String(x.song_position).length)
    )
  }
}


/* fzf filter */
const filtered = computed(()=>{
  if(!fzfMode.value)
    return results.value
  const q = query.value.toLowerCase()
  if(!q) return results.value
  return results.value.filter(r=>{
    const s =
      (r.artist||'')+
      (r.album||'')+
      (r.title||'')
    return s.toLowerCase().includes(q)
  })
})


/* grouping */
const grouped = computed(()=>{
  const map = new Map()
  for(const r of filtered.value){
    const artist = r.albumartist || r.artist || 'Unknown Artist'
    const album  = r.album || 'Unknown Album'
    const key = artist + '||' + album

    if(!map.has(key)){
      map.set(key,{
        key,
        artist,
        album,
        tracks:[]
      })
    }

    map.get(key).tracks.push(r)
  }
  const arr = [...map.values()]
  arr.forEach(a=>{
//    a.tracks.sort((x,y)=>
//      Number(x.track||0) - Number(y.track||0)
//    )
    a.tracks.sort((x,y)=>{

      const px = Number(x.song_position ?? Infinity)
      const py = Number(y.song_position ?? Infinity)

      if(px !== py)
        return px - py

      const tx = Number(x.track ?? 0)
      const ty = Number(y.track ?? 0)

      return tx - ty
    })
  })
  return arr
})

/* various artists helper */
const vaMbId = '89ad4ac3-39f7-470e-963a-56509c546377'
function isVA(track){
  return track.albumartist === 'Various Artists'
      || track.musicbrainz_albumartistid === vaMbId
}

/* selection */
function toggle(file){
  if(selected.value.has(file))
    selected.value.delete(file)
  else
    selected.value.add(file)
}


function selectedTracks(){
  return results.value.filter(r =>
    selected.value.has(r.file)
  )
}


/* ADD */
//function addSelected(){
//  const files = selectedTracks().map(t => t.file)
//  if(!files.length) return
//  cmdBus.send({
//    system:"mpd",
//    cmd:"add",
//    args:files
//  })
//}

function batchAddTracks(tracks, batchBytes = 512*1024) {
  const batches = []
  let batch = []
  let size = 0

  for (const t of tracks) {
    const tStr = JSON.stringify(t) // estimate size in payload
    if (size + tStr.length > batchBytes && batch.length) {
      batches.push(batch)
      batch = []
      size = 0
    }
    batch.push(t)
    size += tStr.length
  }
  if (batch.length) batches.push(batch)
  return batches
}

function addSelected() {
  const tracks = selectedTracks().map(t => t.file)
  const batches = batchAddTracks(tracks)

  for (const batch of batches) {
    cmdBus.send({
      system: "mpd",
      cmd: "add",
      args: batch
    })
    console.log(`[addSelected] sent batch ${batch.length} tracks`)
  }
}


/* DELETE */
/*
function deleteSelected(){
  const pos = selectedTracks()
    .map(t => Number(t.song_position))
    .filter(n => !Number.isNaN(n))

  if(!pos.length) return

  cmdBus.send({
    system:"mpd",
    cmd:"delete",
    args:pos
  })

}
*/
/*
function deleteSelected(){
  console.log("Entered deleteSelected", selectedTracks())
  const pos = selectedTracks()
    .map(t => Number(t.song_position))
    .filter(n => !Number.isNaN(n))
    .sort((a,b)=>a-b)

  if(!pos.length) return

  const ranges = []

  let start = pos[0]
  let prev = pos[0]

  for(let i=1;i<pos.length;i++){

    const cur = pos[i]

    if(cur === prev+1){
      prev = cur
      continue
    }

    if(start === prev)
      ranges.push({range: `${start}:0}`)
    else
      ranges.push({range: `${start}:${prev}`})

    start = cur
    prev = cur
  }

  if(start === prev)
    ranges.push({[start]:0})
  else
    ranges.push({[start]:prev})

  console.log("ranges", ranges())

  cmdBus.send({
    system:"mpd",
    cmd:"delete",
    args:ranges
  })

}
*/

function deleteSelected(){
  const tracks = selectedTracks()
  console.log("Entered deleteSelected", tracks)
  console.log("tracks", tracks.map(t => ({
    file: t.file,
    pos: t.song_position
  })))

  const pos = tracks
    .map(t => Number(t.song_position))
    .filter(n => !Number.isNaN(n))
    .sort((a,b)=>a-b)

  if(!pos.length) return

  const ranges = []

  let start = pos[0]
  let prev = pos[0]

  for(let i=1;i<pos.length;i++){
    const cur = pos[i]

    if(cur === prev+1){
      prev = cur
      continue
    }

    if(start === prev)
      ranges.push({range: `${start}:0`})
    else
      ranges.push({range: `${start}:${prev}`})

    start = cur
    prev = cur
  }

  if(start === prev)
    ranges.push({range: `${start}:0`})
  else
    ranges.push({range: `${start}:${prev}`})

  console.log("ranges", ranges)

  cmdBus.send({
    system:"mpd",
    cmd:"delete",
    args:ranges
  })
}


function deleteSelectedFast(){

  const pos = selectedTracks()
    .map(t => Number(t.song_position))
    .filter(n => !Number.isNaN(n))

  if(!pos.length) return

  const ranges = []
  let start = pos[0], prev = pos[0]

  for(let i=1;i<pos.length;i++){
    const cur = pos[i]
    if(cur !== prev+1){
      ranges.push(start===prev ? {[start]:0} : {[start]:prev})
      start = cur
    }
    prev = cur
  }

  ranges.push(start===prev ? {[start]:0} : {[start]:prev})

  cmdBus.send({
    system:"mpd",
    cmd:"delete",
    args:ranges
  })

}


/* UPDATE SEARCH AFTER DELETE */

onMounted(() => {
  const off = resultBus.on('playlistChanged', () => {
    console.log('Playlist changed event received in SearchView')
    runSearch()
  })

  onUnmounted(() => off())
})

/* IGNORE */

function ignoreSelected(){

  const files = selectedTracks().map(t => t.file)

  files.forEach(f => {

    cmdBus.send({
      system:"mpd",
      cmd:"ignore",
      args:f
    })

  })

}

function toggleAll(){
  if(selected.value.size === results.value.length){
    selected.value.clear()
    return
  }
  results.value.forEach(r=>{
    if(r.file)
      selected.value.add(r.file)
  })
}


/* album helpers */
function toggleAlbum(key){
  if(collapsed.value.has(key))
    collapsed.value.delete(key)
  else
    collapsed.value.add(key)
}

function albumSelected(album){
  return album.tracks.every(t =>
    selected.value.has(t.file)
  )
}

function play(pos){
  if(!pos) return

  cmdBus.send({
    system:'player',
    cmd:'play',
    args:Number(pos)
  })
}


function toggleAlbumSelection(album){
  const all = albumSelected(album)
  album.tracks.forEach(t=>{
    if(all)
      selected.value.delete(t.file)
    else
      selected.value.add(t.file)
  })
}

</script>



<style>

.search-controls{
  display:flex;
  gap:12px;
  align-items:center;
  margin-bottom:8px;
}

.searchbox{
  width:100%;
  font-family:monospace;
}

.sliderbox{
  display:flex;
  align-items:center;
  gap:4px;
}

.sliderbox input{
  display:none;
}

.slider{
  width:32px;
  height:16px;
  background:#ccc;
  border-radius:16px;
  position:relative;
}

.slider::after{
  content:'';
  width:14px;
  height:14px;
  background:white;
  border-radius:50%;
  position:absolute;
  top:1px;
  left:1px;
  transition:.2s;
}

.sliderbox input:checked + .slider::after{
  transform:translateX(16px);
}

.helpicon{
  cursor:pointer;
  padding:2px 6px;
  border-radius:50%;
  background:#ddd;
}

.search-results{
  font-size:14px;
}

.album-group{
  margin-bottom:10px;
}

.album-header{
  font-weight:600;
  padding:4px 0;
  display:flex;
  align-items:center;
  gap:6px;
}

.collapse{
  width:20px;
}

.track-row{
  display:flex;
  gap:8px;
  padding:2px 0 2px 22px;
  align-items:center;
}

.trackno{
  width:28px;
  text-align:right;
  color:#777;
}

.title{
  flex:1;
  cursor: pointer;
}

.album.file-path{
  text-decoration:unset !important;
  font-weight:normal;
  font-size:0.9em;
  line-height:1.0em;
  margin:0;
  padding-left:44px;
}

.helpoverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.5);
  display:flex;
  align-items:center;
  justify-content:center;
}

.helpmodal{
  background:white;
  padding:20px;
  max-width:800px;
  max-height:80vh;
  overflow:auto;
  border-radius:8px;
}

.markdown pre{
  background:#f5f5f5;
  padding:10px;
  overflow:auto;
}

</style>
