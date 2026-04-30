<template>
  <div v-if="visible" :style="panelStyle">
    <!-- drag header -->
    <div
      @mousedown="startDrag"
      style="padding:8px; background:#333; cursor:move; user-select:none;"
    >
      Control Panel

    </div>

<!--    <button @click="showDialog = false"
       style="position:absolute; top:2px; right:2px; font-size:1em; border:none; background:none; cursor:pointer;">
       ✖
    </button>
-->
    <button @click="$emit('close')"
      style="position:absolute; top:2px; right:2px; font-size:1em; border:none; background:none; cursor:pointer;">
      ✖
    </button>

    <!-- tabs -->
    <div style="display:flex;border-bottom:1px solid #444;">
      <div @click="tab='linger'" :style="tabStyle('linger')">linger</div>
      <div @click="tab='playlist'" :style="tabStyle('playlist')">playlist</div>
      <div @click="tab='timer'" :style="tabStyle('timer')">pause timer</div>
    </div>

    <!-- linger tab -->
    <div v-if="tab==='linger'" style="padding:10px;">


    <div>
      <div>blocklimit</div>
      <div style="display:flex; align-items:center; gap:12px; margin-top:4px;">
        <input type="number"
             v-model.number="blocklimit"
             style="width:60px; padding:2px 4px;">
        <label style="display:flex; align-items:center; cursor:pointer;">
          <input type="checkbox"
               @change="toggleBlocklimit"
               style="display:none">

          <span
            :style="{ background: blockEnabled ? '#d73e30' : '#ccc' }"
            style="
              width:42px;
              height:22px;
              border-radius:11px;
              position:relative;
              transition:0.2s;"
            >

            <span
              :style="{ transform: blockEnabled ? 'translateX(20px)' : 'translateX(0)' }"
              style="
                position:absolute;
                top:3px;
                left:3px;
                width:16px;
                height:16px;
                background:white;
                border-radius:50%;
                transition:0.2s;"
            >
            </span>
          </span>
        </label>
      </div>
    </div>


      <div style="margin-top:10px;">
        limit<br>
        <input type="number" v-model.number="limit" style="width:60px">
        <button @click="emitCmd('limit', limit)">set</button>
        <button @click="emitCmd('limit')">reset</button>
      </div>

      <div style="margin-top:10px;">
        count<br>
        <input type="number" v-model.number="count" style="width:60px">
        <button @click="emitCmd('count', count)">set</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px;">
        <!-- XY header -->
        <div style="font-weight:bold;">X⚡Y</div>

        <!-- inputs + radio buttons -->
        <div style="display:flex; align-items:flex-end; gap:10px;">
          <!-- start X -->
          <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <label>Start</label>
              <input type="number" min="0" step="1" v-model.number="xyStart" style="width:65px">
          </div>

          <!-- end Y -->
          <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <label>End/Inc.</label>
              <input type="text" v-model="xyEnd" style="width:65px">
          </div>

          <!-- on/off slider toggle -->
          <div style="display:flex; align-items:center; margin-left:10px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox"
                     @change="toggleXY"
                     style="display:none">
              <span
                :style="{ background: xyEnabled ? '#d73e30' : '#ccc' }"
                style="
                  width:40px;
                  height:20px;
                  border-radius:10px;
                  position:relative;
                  transition:0.2s;"
                >
                <span 
                  :style="{ transform: xyEnabled ? 'translateX(20px)' : 'translateX(0)' }"
                  style="
                    position:absolute;
                   top:2px;
                   left:2px;
                   width:16px;
                   height:16px;
                   background:white;     /* button color */
                   border-radius:50%;
                   transition:0.2s;"
                ></span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>


    <!-- playlist tab -->
    <div v-if="tab==='playlist'" style="padding:10px;">
      <div>
        Playlist<br> Current +/- <em>n:</em><br>
        <input
          type="number"
          min="1"
          v-model.number="localPlaylistN"
          style="width:80px"
        >
      </div>
    </div>



    <!-- timer tab -->
    <div v-if="tab==='timer'" style="padding:10px;">

      <div style="margin-top:14px;">
        <div>pause timer (min)</div>
<!--
        <div style="display:flex; align-items:center; gap:12px; margin-top:4px;">
          <input type="number"
            v-model.number="pauseTimerDurMin"
            style="width:70px; padding:2px 4px;">

          <label style="display:flex; align-items:center; cursor:pointer;">
            <input type="checkbox" v-model="pauseEnabled" style="display:none">
            <span
              :style="{ background: pauseEnabled ? '#d73e30' : '#ccc' }"
              style="width:42px;height:22px;border-radius:11px;position:relative;transition:0.2s;"
            >
              <span
                :style="{ transform: pauseEnabled ? 'translateX(20px)' : 'translateX(0)' }"
                style="position:absolute;top:3px;left:3px;width:16px;height:16px;background:white;border-radius:50%;transition:0.2s;"
              >
              </span>
            </span>






          </label>
-->
<!--
<div style="position:relative; display:inline-block;">
  <input
    type="number"
    v-model.number="pauseTimerDurMin"
    style="width:70px; padding:2px 20px 2px 4px;"
  >

  <span
    v-if="pauseTimerDurMin > 0"
    @click="pauseTimerDurMin = 0"
    style="
      position:absolute;
      right:4px;
      top:20%;
      transform:translateY(-50%);
      cursor:pointer;
      color:#aaa;
      font-size:12px;
    "
  >
    ✖
  </span>
</div>
        </div>
-->
<div style="display:flex; align-items:center; gap:12px; margin-top:4px;">

  <!-- input + X -->
  <div style="position:relative; display:inline-block;">
    <input
      type="number"
      v-model.number="pauseTimerDurMin"
      style="width:70px; padding:2px 20px 2px 4px;"
    >

    <span
      v-if="pauseTimerDurMin > 0"
      @click="pauseTimerDurMin = 0"
      style="
        position:absolute;
        right:4px;
        top:50%;
        transform:translateY(-50%);
        cursor:pointer;
        color:#aaa;
        font-size:12px;
      "
    >
      ✖
    </span>
  </div>

  <!-- toggle -->
<!--
  <label style="display:flex; align-items:center; cursor:pointer;">
    <input type="checkbox" v-model="pauseEnabled" style="display:none">
    <span
      :style="{ background: pauseEnabled ? '#d73e30' : '#ccc' }"
      style="width:42px;height:22px;border-radius:11px;position:relative;transition:0.2s;"
    >
      <span
        :style="{ transform: pauseEnabled ? 'translateX(20px)' : 'translateX(0)' }"
        style="position:absolute;top:3px;left:3px;width:16px;height:16px;background:white;border-radius:50%;transition:0.2s;"
      >
      </span>
    </span>
  </label>
-->



  <!-- toggle switch -->
  <label style="display:flex; align-items:center; cursor:pointer;">
    <input type="checkbox" v-model="pauseEnabled" style="display:none">
    <span :style="{ background: pauseEnabled ? '#d73e30' : '#ccc' }"
          style="width:42px;height:22px;border-radius:11px;position:relative;transition:0.2s;">
      <span :style="{ transform: pauseEnabled ? 'translateX(20px)' : 'translateX(0)' }"
            style="position:absolute;top:3px;left:3px;width:16px;height:16px;background:white;border-radius:50%;transition:0.2s;">
      </span>
    </span>
  </label>

</div>

<div style="margin-top:10px; display:flex; gap:8px;">
  <button @click="addorset(30)">30</button>
  <button @click="addorset(60)">60</button>
  <button @click="addorset(90)">90</button>
  <button @click="pauseToEnd">song</button>
</div>

      </div>
    </div>
  </div>



  <!-- Resume modal -->
  <div v-if="showResumeModal"
       style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%);
              background:#222; color:#fff; padding:20px; border-radius:8px;
              box-shadow:0 0 12px rgba(0,0,0,0.6); z-index:9999;">
    <div style="margin-bottom:10px;">
      Pause timer expired. Resume playback?
    </div>

    <div style="display:flex; gap:10px; justify-content:center;">
      <button @click="emit('action', 'resume_playback'); showResumeModal = false">Yes</button>
      <button @click="showResumeModal = false">No</button>
    </div>
  </div>












</template>

<script setup>
const debug = false
import { ref, computed, watch, inject } from 'vue'

const layout = inject('layout')

const props = defineProps({
  visible: Boolean,
  linger: Object,
  playlistCurrentN: Number,
  pauseTimer: Object,
  activeTab: String,
//  pauseTimerDurMin: Number,
  pauseTimerMin: Number,
})


const emit = defineEmits([
  'cmd',
  'close',
  'update:playlistCurrentN',
	'action',
  'update:pauseTimerDurMin',
  'updateCurrentWindow',
//  'update:pauseTimer'
])

//const tab = ref('linger')
const tab = ref(props.activeTab || 'linger')
const x = ref(40)
const y = ref(80)
const dragging = ref(false)

const blocklimit = ref(0)
const blockEnabled = ref(false)
const limit = ref(0)
const count = ref(0)
const xyStart = ref(null)
const xyEnd = ref('')
const xyEnabled = ref(false)

const localPlaylistN = ref(Number(props.playlistCurrentN) || 12)
const showResumeModal = ref(false)
const localTimerRem = ref(props.pauseTimer?.remaining || 0)

/* NEW: pause timer state (UI only) */
//const pauseTimerDurMin = ref(props.pauseTimerDurMin || 0)
const pauseTimerDurMin = ref(props.pauseTimerMin || 0)


watch(() => props.activeTab, (t) => {
  if (t) tab.value = t
}, { immediate: true })


//watch(() => props.pauseTimerDurMin, (v) => {
//  if (v != null) {
//    pauseTimerDurMin.value = v
//  }
//}, { immediate: true })
//
//const pauseEnabled = computed({
//  get: () => !!props.pauseTimer?.active,
//  set: (val) => {
//    emit('action', {
//      type: val ? 'pause_timer_on' : 'pause_timer_off',
//      min: Number(pauseTimerDurMin.value) || 0
//    })
//  }
//})

watch(() => props.pauseTimer, (t) => {
  if (t?.active && t.duration > 0) {
    pauseTimerDurMin.value = Math.floor(t.duration / 60)
  }
}, { immediate: true })

// OBJECT form of pauseToEnd
//const pauseToEnd = () => {
//  emit('action', {
//    type: 'pause_timer_end'
//  })
//}

const pauseToEnd = () => {
  emit('action', 'pause_timer_end')
}

const pauseEnabled = computed({
  get: () => !!props.pauseTimer?.active,
  set: (val) => {
    const min = Number(pauseTimerDurMin.value) || 0

    if (val) {
      emit('action', {
        type: 'pause_timer_on',
        min
      })
    } else {
      wasActive.value = false
      emit('action', {
        type: 'pause_timer_off'
      })
      showResumeModal.value = false
    }
  }
})

const wasActive = ref(false)
watch(() => props.pauseTimer?.remaining, (rem, oldRem) => {
  localTimerRem.value = rem
  // trigger modal if timer counted down from >0 to 0
  if (oldRem > 0 && rem === 0 && wasActive.value) {
    showResumeModal.value = true
  }
  wasActive.value = props.pauseTimer?.active
})


const addorset = (min) => {
  if (!pauseEnabled.value && pauseTimerDurMin.value === 0) {
    pauseTimerDurMin.value = min
  } else {
    pauseTimerDurMin.value += min
  }
}

if ( debug ) {
  console.log('[CPnl] props.pauseTimerMin:', props.pauseTimerMin)
  console.log('[CPnl] paueEnabled:', pauseEnabled)
  console.log('[CPnl] props.pauseTimerDurMin', props.pauseTimerDurMin)
}

const panelStyle = computed(() => ({
  position:'fixed',
  left: x.value + 'px',
  top: y.value + 'px',
//  width:'85vw',
  width: layout.narrow.value ? '85vw' : '340px',
  background:'#1e1e1e',
  color:'#eee',
  borderRadius:'6px',
  boxShadow:'0 0 12px rgba(0,0,0,0.6)',
  zIndex: 9999
}))

const tabStyle = (name) => ({
  flex: 1,
  padding: '6px',
  cursor: 'pointer',
  background: tab.value === name ? '#333' : 'transparent'
})

let ox = 0
let oy = 0

const startDrag = (ev) => {
  dragging.value = true
  ox = ev.clientX - x.value
  oy = ev.clientY - y.value
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

const move = (ev) => {
  if (!dragging.value) return
  x.value = ev.clientX - ox
  y.value = ev.clientY - oy
}

const stop = () => {
  dragging.value = false
  window.removeEventListener('mousemove', move)
  window.removeEventListener('mouseup', stop)
}

const emitCmd = (cmd, args) => {
  emit('cmd', { system: 'linger', cmd, args })
}

/* ------------------ pause timer ------------------ */

//const pause_timer_on = () => {
//  const min = Number(pauseTimerDurMin.value) || 0
//  if (min <= 0) return
//  sec = min * 60
//  emit('action', { action: 'pause_timer_on', pauseTimerDurMin: pauseTimerDurMin.value })
////  emit('cmd', {
////    action: 'pause_timer_on',
////    pauseTimerDurMin: min
////  })
//}
//
//const pause_timer_off = () => {
//  emit('cmd', {
//    action: 'pause_timer_off'
//  })
//}

function loadXY(data) {
  if (data.lingerxy) {
    xyEnabled.value = true
    xyStart.value = data.lingerx
    xyEnd.value = data.lingery
  } else {
    xyEnabled.value = false
    xyStart.value = null
    xyEnd.value = ''
  }
}

function toggleXY() {
  if (xyEnabled.value) {
    xyEnabled.value = false
    xyStart.value = null
    xyEnd.value = ''

    emit('cmd', {
      system: 'linger',
      cmd: 'xy',
      args: { lingerxy: false, lingerx: 0, lingery: 0, xyinc: false }
    })
    return
  }

  const xval = Number(xyStart.value)
  if (!Number.isInteger(xval) || xval < 0) return

  const rawY = String(xyEnd.value).trim()
  if (!rawY) return

  const hasPlus  = rawY.startsWith('+')
  const hasMinus = rawY.startsWith('-')
  const hasSign  = hasPlus || hasMinus

  if ((hasPlus || hasMinus) && rawY.length === 1) return

  const yval = Number(rawY)
  if (!Number.isInteger(yval)) return
  if (hasSign && yval === 0) return

  xyEnabled.value = true

  emit('cmd', {
    system: 'linger',
    cmd: 'xy',
    args: {
      lingerxy: true,
      lingerx: xval,
      lingery: yval,
      xyinc: hasSign
    }
  })
}

function toggleBlocklimit() {
  console.log('toggleBlocklimit fired')
  blockEnabled.value = !blockEnabled.value
  emit('cmd', {
    system: 'linger',
    cmd: 'blocklimit',
    args: blockEnabled.value ? blocklimit.value : 0
  })

  if (!blockEnabled.value) blocklimit.value = 0
  console.log('emit action json_status')
  emit('action', 'json_status')
}

watch(() => props.linger?.blocklimit, (val) => {
  if (typeof val === 'number') {
    blocklimit.value = val
    blockEnabled.value = val > 0
  }
})

watch(() => props.linger, (val) => {
  if (!val) return
  loadXY(val)
}, { immediate: true, deep: true })

watch(blocklimit, (val) => {
  if (val === 0 && blockEnabled.value) {
    blockEnabled.value = false
    emitCmd('blocklimit', 0)
  }
})

watch(() => props.playlistCurrentN, (val) => {
  localPlaylistN.value = Number(val) || 12
})

watch(localPlaylistN, (val) => {
  emit('update:playlistCurrentN', Number(val) || 12)
})
</script>
