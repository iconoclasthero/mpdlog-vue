<template>
  <div>
  <hr style="background-color:#912715">
    <div class="button-container">
      <!-- MPD Controls -->
      <div class="button-row d-flex gap-2 align-items-center">
        <form id="controlForm1">
          <h5 style="margin-bottom: 10px;">MPD controls:</h5>
          <button type="button" 
                  @click="$emit('action', 'toggle_playback')" 
                  class="btn btn-primary" 
                  title="Toggle playback">
            ⏯️
          </button>
          <button type="button" 
                  @click="$emit('action', 'next_track')" 
                  class="btn btn-primary" 
                  title="Next track">
            ⏭️
          </button>
          <button v-if="!playerState?.random" 
                  type="button" 
                  @click="$emit('action', 'enable_random')" 
                  class="btn btn-info" 
                  title="Enable random">
            ✅ 🔀
          </button>
          <button v-else 
                  type="button" 
                  @click="$emit('action', 'disable_random')" 
                  class="btn btn-info" 
                  title="Disable random">
            ❌ 🔀
          </button>
          <button type="button" 
                  @click="$emit('action', 'ignore')"
                  class="btn btn-outline-danger"
                  title="Ignore this item">
            🚫
          </button>
        </form>
      </div>

      <!-- Volume Controls -->
      <div class="button-row d-flex gap-2 align-items-center">
        <form id="controlForm2">
          <h5 style="margin-bottom: 10px;">Pulseaudio Volume:</h5>
          <button type="button"
                  @click="$emit('action', 'mute_volume')"
                  class="btn btn-info"
                  title="Mute">
            🔇
          </button>
          <button type="button"
                  @click="$emit('action', 'DOWN_VOLUME')"
                  class="btn btn-info"
                  title="Volume down">
            🔉
          </button>
          <button type="button"
                  @click="$emit('action', 'UP_VOLUME')"
                  class="btn btn-info"
                  title="Volume up">
            🔊
          </button>
          <button type="button"
                  class="btn btn-info"
                  style="padding:2px 2px"
                  title="Toggle output"
                  @click="$emit('action', 'toggle_output')">
            <IcecastIcon style="width:2.0em;height:2.0em;" />
          </button>
        </form>
      </div>

      <!-- Log Controls -->
      <div class="button-row d-flex gap-2 align-items-center">
        <form id="controlForm3">
          <h5 style="margin-bottom: 10px;">Logs/Song Info:</h5>

          <button v-if="viewMode !== 'long'"
                  type="button"
                  @click="$emit('action', 'viewLong')"
                  class="btn btn-secondary"
                  title="Long log">
            📜
          </button>
          <button v-else
                  type="button"
                  @click="$emit('action', 'viewDefault')"
                  class="btn btn-danger"
                  title="Return">
            ↩️
          </button>

          <button v-if="viewMode !== 'raw'"
                  type="button"
                  @click="$emit('change-view', 'raw')"
                  class="btn btn-secondary"
                  title="Raw log">
            📝
          </button>
          <button v-else
                  type="button"
                  @click="$emit('change-view', 'default')"
                  class="btn btn-danger"
                  title="Return">
            ↩️
          </button>

          <button v-if="viewMode !== 'playing'"
                  type="button"
                  @click="$emit('change-view', 'playing')"
                  class="btn btn-secondary"
                  title="Currently playing details">
            🎵💫🎶
          </button>
          <button v-else
                  type="button"
                  @click="$emit('change-view', 'default')"
                  class="btn btn-danger"
                  title="Return">
            ↩️
          </button>
          <button v-if="viewMode !== 'search'"
                  type="button"
                  @click="$emit('change-view', 'search')"
                  class="btn btn-secondary"
                  title="Open search view">
            🔍
          </button>
          <button v-else
                  type="button"
                  @click="$emit('change-view', 'default')"
                  class="btn btn-danger"
                  title="Return">
            ↩️
          </button>
        </form>
      </div>
    </div>
  </div>
  <hr style="background-color:#912715">
  <div>
  github:
  <a href="https://github.com/iconoclasthero/mpdgolinger" rel="noopener noreferrer" target="_blank" class="hidden-link">mpdgolinger</a>
  &nbsp;—&nbsp;
  <a href="https://github.com/iconoclasthero/mpdlog-vue" rel="noopener noreferrer" target="_blank" class="hidden-link">mpdlog-vue</a>
</div>
</template>

<script>
import IcecastIcon from './IcecastIcon.vue'

export default {
  name: 'NavButtons',
  components: {
    IcecastIcon
  },
  props: {
    viewMode: String,
    playerState: Object,
    linger: Object
  },
  emits: ['action', 'change-view']
}
</script>
