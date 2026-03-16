<template>
  <div class="circle-container" v-if="duration > 0">
    <svg class="progress-ring" width="120" height="120" @click="handleClick" style="cursor:pointer">
      <circle
        class="progress-ring__background"
        :stroke="bgcolor"
        stroke-width="6"
        fill="transparent"
        :r="radius"
        cx="60"
        cy="60"
      />
<path
  class="progress-ring__circle"
  :stroke="color"
  stroke-width="16"
  fill="transparent"
  :d="arcPath"
/>
    </svg>
    <img :src="imgSrc" class="center-image" />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue"

const props = defineProps({
  elapsed: { type: Number, required: true },
  duration: { type: Number, required: true },
  imgSrc: { type: String, default: "/android-icon-96x96.png" },
  color: { type: String, default: "#3b82f6" },
  bgcolor: { type: String, default: "#404040" },
  playing: { type: Boolean, default: true }
})

const emit = defineEmits(['seek', 'action'])

const radius = 52
const localElapsed = ref(props.elapsed)
let timer = null



const arcPath = computed(() => {
  if (!props.duration) return ""

  const percent = localElapsed.value / props.duration
  const theta = percent * 2 * Math.PI

  if (theta <= 0) return ""

  const cx = 60
  const cy = 60
  const r = radius

  const startAngle = -theta / 2
  const endAngle   =  theta / 2

  const toXY = (angle) => {
    const a = angle - Math.PI / 2
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a)
    }
  }

  const start = toXY(startAngle)
  const end   = toXY(endAngle)

  const largeArcFlag = theta > Math.PI ? 1 : 0

  return `
    M ${start.x} ${start.y}
    A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
  `
})



// Update localElapsed when props change
watch(
  () => props.elapsed,
  (v) => { localElapsed.value = v },
  { immediate: true }
)

// ---- CLICK TO SEEK ----
const handleClick = (event) => {
  if (!props.duration) return

  const rect = event.currentTarget.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2

  const x = event.clientX - rect.left - cx
  const y = event.clientY - rect.top - cy

  let angle = Math.atan2(y, x)

  // Make 12 o'clock = 0
  angle -= Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI

  // Convert to range 0 → π (mirror both halves)
  let halfAngle = angle <= Math.PI
    ? angle
    : (2 * Math.PI - angle)

  const percent = halfAngle / Math.PI
  const seconds = percent * props.duration

  emit('seek', seconds)
}

// Compute dash offset

// Timer
watch(
  () => props.playing,
  (isPlaying) => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (isPlaying) {
      timer = setInterval(() => {
        localElapsed.value += 1
        if (localElapsed.value > props.duration * 1.1) {
          console.log("elapsed exceeded duration * 1.1 → refresh json-status")
//          emit('refresh-status')
          emit('action', 'json-status')
        }
      }, 1000)
    }
  },
  { immediate: true }
)

onUnmounted(() => { if(timer) clearInterval(timer) })
</script>


<style scoped>
.circle-container {
  position: relative;
  width: 120px;
  height: 120px;
}
.progress-ring { transform: rotate(180deg); }
.center-image {
  position: absolute;
  top: 50%; left: 50%;
  width: 96px; height: 96px;
  border-radius: 50%;
  transform: translate(-50%,-50%);
}
</style>

