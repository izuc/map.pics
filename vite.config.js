import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: "mappics.[ext]",
        entryFileNames: "mappics.js",
        chunkFileNames: "mappics.js"
      }
    }
  },
  server: { port: 1100 },
  plugins: [react()]
})