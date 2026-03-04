/<template>
  <div class="album-art-container">
    <img
      v-if="albumArtData"
      :src="albumArtData"
      alt="Album Art"
      :style="{ maxWidth: `calc(${maxWidth} * 1.2)`, height: 'auto' }"
    >

    <div v-else-if="isLoading" class="musicdna-placeholder" :style="{ width: maxWidth }">
      <p>Loading album art...</p>
    </div>

<!--
    <div v-else-if="backupUrl" class="musicdna-placeholder" :style="{ width: maxWidth }">
      <img :src="backupUrl" alt="Backup Album Art" style="width: 100%; height: auto;">
      <p>No album art available, showing backup</p>
    </div>
-->

    <div v-else-if="isDead" class="musicdna-placeholder" :style="{ width: maxWidth }">
      <img :src="deadSVGurl" alt="Grateful Dead SVG" style="width: 100%; height: auto;">
    </div>

    <div v-else class="musicdna-placeholder" :style="{ width: maxWidth }">
      <img src="../../assets/musicdna.svg" alt="MusicDNA" style="width: 100%; height: auto;">
    </div>

<!--    <div v-else class="musicdna-placeholder" :style="{ width: maxWidth }"> 
      <p>No album art available</p>
    </div>
-->
  </div>
  <hr>
</template>

<script>
export default {
  name: 'AlbumArt',
  props: {
    albumArtData: String,
    artist: String,
    mbArtistID: String
  },
  data() {
    return {
      isLoading: false,
      maxWidth: '300px', // fallback default; will measure dynamically on mount
      deadSVGurl: null,
      isDead: false
    }
  },
  mounted() {
    // Dynamically size the image to the width of the status line
    this.$nextTick(() => {
      const statusLine = document.querySelector('.album.desktop')
      if (statusLine) {
        this.maxWidth = statusLine.offsetWidth + 'px'
      }
    })

//    // Determine backup URL based on artist
//    if (this.artist) {
//      const normalized = this.artist.toLowerCase().replace(/\s+/g, '_')
//      const deadFolder = ['grateful_dead', 'dead'] // example folder names
//      if (deadFolder.includes(normalized)) {
//        this.backupUrl = '/dead/dead.png'
//      } else {
//        // fallback to generic png/svg
//        this.backupUrl = `/backup/${normalized}.png`
//      }
//    }
    // Grateful Dead SVG fallback logic
    if (
      (this.artist && this.artist.includes('Grateful Dead')) ||
      this.mbArtistId === '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'
    ) {
      this.isDead = true

      // randomly select one svg from /assets/dead/
//      const modules = import.meta.glob('../../assets/dead/*.svg', { eager: true })
      const modules = import.meta.glob('./dead/*.svg', { eager: true })
      const paths = Object.values(modules).map(m => m.default)

//       this.deadSVGurl = deadSVGs[Math.floor(Math.random() * deadSVGs.length)]
       if (paths.length > 0) {
         this.deadSVGUrl = paths[Math.floor(Math.random() * paths.length)]
       }
    }
  }
}
</script>

<style scoped>

.album-art-container {
/*  display: flex;                 /* keep flex to control layout */
/*  justify-content: flex-start;   /* left-align content inside */
/*  align-items: center;           /* vertically center */
  margin: 0;                     /* no auto centering */
  padding: 0;
}

.album-art-container img {
/*  display: inline-block; /* inline-block keeps it left-aligned */
  display: block;
  margin: 0;
}

.musicdna-placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* left-align text */
  justify-content: center;
  color: gray;
  font-size: 0.9em;
  text-align: left;        /* left-align text */
  border: 1px dashed #ccc;
  padding: 10px;
  margin: 5px 0;
}
</style>
