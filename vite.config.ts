import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Split heavy eager deps into long-cached vendor chunks.
    // (MapLibre stays in its own dynamic chunk via lazy import in App.tsx.)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three') || id.includes('globe.gl')) return 'globe'
          if (id.includes('@turf') || id.includes('/turf/')) return 'turf'
          if (id.includes('framer-motion')) return 'motion'
        },
      },
    },
  },
})
