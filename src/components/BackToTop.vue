<template>
  <button
    v-show="show"
    @click="goTop"
    :style="{
      position: 'fixed',
      bottom: '20px',
      left: left + 'px',
      padding: '18px 12px',
      background: '#d94031',
      color: '#fff',
      outline: 'none',
      border: 'none',
      borderRadius: '90px',
      cursor: 'pointer'
    }"
  >
    ↑ Top
  </button>
</template>

<script>
export default {
  name: 'BackToTop',
  props: { show: Boolean },
  data() {
    return {
      left: 0,
      checkInterval: null
    }
  },
  mounted() {
    const updatePosition = () => {
      const statusLine = document.querySelector('.album.desktop')
      if (statusLine) {
        const rect = statusLine.getBoundingClientRect()
        this.left = rect.left + rect.width * 1.5
      }
    }

    // Try once immediately
    this.$nextTick(updatePosition)

    // Retry until the element exists (safe for async child components)
    this.checkInterval = setInterval(() => {
      const statusLine = document.querySelector('.album.desktop')
      if (statusLine) {
        updatePosition()
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
    }, 50)

    // Update on window resize
    window.addEventListener('resize', updatePosition)
  },
  beforeUnmount() {
    if (this.checkInterval) clearInterval(this.checkInterval)
    window.removeEventListener('resize', updatePosition)
  },
  methods: {
    goTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
