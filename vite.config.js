import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    preserveSymlinks: true
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    watch: {
      followSymlinks: true
    }
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
