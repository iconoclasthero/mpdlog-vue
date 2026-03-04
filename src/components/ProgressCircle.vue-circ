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
      <circle
        class="progress-ring__circle"
        :stroke="color"
        stroke-width="16"
        fill="transparent"
        :r="radius"
        cx="60"
        cy="60"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
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

const emit = defineEmits(['seek'])

const radius = 52
const circumference = 2 * Math.PI * radius
const localElapsed = ref(props.elapsed)
const dashOffset = ref(-circumference * (1 - (props.elapsed / props.duration)))
let timer = null

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

  // raw angle in radians
  let angle = Math.atan2(y, x)

  // adjust for rotated SVG: -90deg rotation
  angle += Math.PI / 2

  if (angle < 0) angle += 2 * Math.PI

  // 🔥 flip direction (this fixes mirror issue)
  angle = (2 * Math.PI) - angle

  // convert to 0–1 fraction of circle
  const percent = angle / (2 * Math.PI)
  const seconds = percent * props.duration

  console.log("clicked:", { x, y, angle, percent, seconds })  // debug

  emit('seek', seconds)
}

// Compute dash offset
const updateDash = () => {
  dashOffset.value = -circumference * (1 - (localElapsed.value / (props.duration || 1)))
}
watch([localElapsed, () => props.duration], updateDash, { immediate: true })

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
        }
      }, 1000)
    }
  },
  { immediate: true }
)

onUnmounted(() => { if(timer) clearInterval(timer) })
</script>

<!--
<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue"

const props = defineProps({
  elapsed: { type: Number, required: true },
  duration: { type: Number, required: true },
  imgSrc: { type: String, default: "/android-icon-96x96.png" },
  color: { type: String, default: "#3b82f6" },
  bgcolor: { type: String, default: "#404040" },
  playing: { type: Boolean, default: true } // optional, lets you pause timer
})

const emit = defineEmits(['seek'])

console.log("ProgressCircle props:", props)  // <-- debug console

// For temporary on-screen debug
const debugMsg = computed(() => `elapsed: ${props.elapsed}, duration: ${props.duration}, playing: ${props.playing}`)


const radius = 52
const circumference = 2 * Math.PI * radius

// Local elapsed for live updating
const localElapsed = ref(props.elapsed)
const dashOffset = ref(-circumference * (1 - (props.elapsed / props.duration)))

// Timer
let timer = null

// Update localElapsed whenever props.elapsed changes (e.g., new JSON)
watch(
  () => props.elapsed,
  (v) => { localElapsed.value = v },
  { immediate: true }
)

//// Seek via progress circle
//const handleClick = (event) => {
//  const rect = event.currentTarget.getBoundingClientRect()
//  const x = event.clientX - rect.left - rect.width / 2
//  const y = event.clientY - rect.top - rect.height / 2
//
//  const angle = Math.atan2(y, x)
//  let percent = (angle + Math.PI/2) / (2 * Math.PI)
//
//  if (percent < 0) percent += 1
//
//  const newTime = percent * props.duration
//
//  emit('seek', newTime)
//}


const handleClick = (event) => {
  if (!props.duration) return

  const rect = event.currentTarget.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2

  const x = event.clientX - rect.left - cx
  const y = event.clientY - rect.top - cy

  let angle = Math.atan2(y, x)

  // rotate so 12 o'clock is zero
  angle += Math.PI / 2

  if (angle < 0) angle += 2 * Math.PI

  const percent = angle / (2 * Math.PI)
  const seconds = percent * props.duration
  emit('seek', seconds)
}


// Compute dash offset on the fly
const updateDash = () => {
  dashOffset.value = -circumference * (1 - (localElapsed.value / (props.duration || 1)))
}
watch([localElapsed, () => props.duration], updateDash, { immediate: true })

//// Timer increment
//onMounted(() => {
//  if (props.playing) {
//    timer = setInterval(() => {
//      if (localElapsed.value < props.duration) {
//        localElapsed.value += 1
//      }
//    }, 1000)
//  }
//})

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

        // ---- REQUIRED overflow logic ----
        if (localElapsed.value > props.duration * 1.1) {
          console.log("elapsed exceeded duration * 1.1 → should refresh json-status")
          // emit event here if you want
        }
      }, 1000)
    }
  },
  { immediate: true }
)

onUnmounted(() => { if(timer) clearInterval(timer) })
</script>
-->

<style scoped>
.circle-container {
  position: relative;
  width: 120px;
  height: 120px;
}
.progress-ring { transform: rotate(-90deg); }
.center-image {
  position: absolute;
  top: 50%; left: 50%;
  width: 96px; height: 96px;
  border-radius: 50%;
  transform: translate(-50%,-50%);
}
</style>

