import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Listen on all network interfaces
    strictPort: false
  },
  build: {
    outDir: '/var/www/mpdlog-vue',  // target folder
    assetsDir: 'assets-',            // hashed assets here
    emptyOutDir: false,             // don't wipe anything else in /var/www/mpdlog-vue
    rollupOptions: {
      output: {
        entryFileNames: 'index-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]'
      }
    }
  }
})
