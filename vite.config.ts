import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: '/tmp/vite-cache',
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor'
          }

          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor'
          }
        },
      },
    },
  },
})
