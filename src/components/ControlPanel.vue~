<template>
  <div v-if="visible" :style="panelStyle">
    <!-- drag header -->
    <div
      @mousedown="startDrag"
      style="padding:8px; background:#333; cursor:move; user-select:none;"
    >
      Control Panel

    </div>

    <button @click="showDialog = false"
       style="position:absolute; top:2px; right:2px; font-size:1em; border:none; background:none; cursor:pointer;">
       ✖
    </button>

    <!-- tabs -->
    <div style="display:flex;border-bottom:1px solid #444;">
      <div @click="tab='linger'" :style="tabStyle('linger')">linger</div>
      <div @click="tab='dummy'" :style="tabStyle('dummy')">dummy</div>
    </div>

    <!-- linger tab -->
    <div v-if="tab==='linger'" style="padding:10px;">


    <div>
      <div>blocklimit</div>
      <div style="display:flex; align-items:center; gap:12px; margin-top:4px;">
        <input type="number"
               v-model.number="blocklimit"
               style="width:70px; padding:2px 4px;">
        <label style="display:flex; align-items:center; cursor:pointer;">
          <input type="checkbox"
                 @change="toggleBlocklimit"
                 style="display:none">

          <span
            :style="{ background: blockEnabled ? '#4ade80' : '#ccc' }"

            style="
              width:42px;
              height:22px;
              border-radius:11px;
              position:relative;
              transition:0.2s;
            ">


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
                transition:0.2s;
            ">
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
            <input type="number" v-model.number="xyStart" style="width:60px">
          </div>

          <!-- end Y -->
          <div style="display:flex; flex-direction:column; align-items:flex-start;">
            <label>End/Inc.</label>
            <input type="number" v-model.number="xyEnd" style="width:60px">
          </div>

          <!-- on/off slider toggle -->
          <div style="display:flex; align-items:center; margin-left:10px;">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" v-model="xyEnabled" style="display:none">
              <span style="
                width:40px;
                height:20px;
                background:#ccc; /* path color */
                border-radius:10px;
                position:relative;
                transition:0.2s;
              " :class="{ 'bg-green-500': xyEnabled }">
                <span style="
                  position:absolute;
                  top:2px;
                  left:2px;
                  width:16px;
                  height:16px;
                  background:white;     /* button color */
                  border-radius:50%;
                  transition:0.2s;
                " :style="{ transform: xyEnabled ? 'translateX(20px)' : 'translateX(0)' }"></span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>






    <!-- dummy tab -->
    <div v-if="tab==='dummy'" style="padding:10px;">nothing yet</div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ControlPanel',
  props: {
    visible: Boolean,
    linger: Object
  },
  emits: ['cmd'],
  setup(props, { emit }) {
    const tab = ref('linger')
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
    const xyInc = ref(1)

    const panelStyle = computed(() => ({
      position:'fixed',
      left: x.value + 'px',
      top: y.value + 'px',
      width:'340px',
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

    const setXY = () => {
      if (!xyEnabled.value) {
        emit('cmd', {
          system: 'linger',
          cmd: 'xy',
          args: { enabled: false }
        })
        return
      }

      emit('cmd', {
        system: 'linger',
        cmd: 'xy',
        args: {
          enabled: true,
          start: xyStart.value,
          end: xyEnd.value,
          inc: xyInc.value
        }
      })
    }

    watch(xyEnabled, (val) => {
      if (!val) {
        emit('cmd', {
          system: 'linger',
          cmd: 'xy',
          args: { enabled: false }
        })
        return
      }

      emit('cmd', {
        system: 'linger',
        cmd: 'xy',
        args: {
          enabled: true,
          start: xyStart.value,
          end: xyEnd.value,
          inc: xyInc.value
        }
      })
    })

    const handleKey = (e) => {
      if (e.key !== 'Enter') return

      if (xyEnabled.value) {
        emit('cmd', {
          system: 'linger',
          cmd: 'xy',
          args: {
            enabled: true,
            start: xyStart.value,
            end: xyEnd.value,
            inc: xyInc.value
          }
        })
      }

      emit('cmd', { system: 'ui', cmd: 'closeControlPanel' })
    }


function loadXY(data) {
  if (data.lingerxy) {
    xyEnabled.value = true
    xyStart.value = data.lingerx
    xyEnd.value = data.lingery
  } else {
    xyEnabled.value = false
    xyStart.value = null
    xyEnd.value = null
  }
}

function toggleBlocklimit() {
  blockEnabled.value = !blockEnabled.value

  if (blockEnabled.value) {
    emit('cmd', {
      system: 'linger',
      cmd: 'blocklimit',
      args: blocklimit.value
    })
  } else {
    blocklimit.value = 0
    emit('cmd', {
      system: 'linger',
      cmd: 'blocklimit',
      args: 0
    })
  }
}

watch(() => props.linger?.blocklimit, (val) => {
  if (typeof val === 'number') {
    blocklimit.value = val
    blockEnabled.value = val > 0
  }
})
watch(blocklimit, (val) => {
  if (val === 0 && blockEnabled.value) {
    blockEnabled.value = false

    emit('cmd', {
      system: 'linger',
      cmd: 'blocklimit',
      args: 0
    })
  }
})
    onMounted(() => window.addEventListener('keydown', handleKey))
    onUnmounted(() => window.removeEventListener('keydown', handleKey))

    return {
      tab,
      panelStyle,
      tabStyle,
      startDrag,
      blocklimit,
      limit,
      count,
      xyStart,
      xyEnd,
      xyEnabled,
      xyInc,
      emitCmd,
      setXY,
      blocklimit,
      blockEnabled,
      toggleBlocklimit

    }
  }
}
</script>
