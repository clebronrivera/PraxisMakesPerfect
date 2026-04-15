import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Inject the short git SHA as a build-time constant so Sentry can tag errors
// with the exact release they came from. Fall back to 'unknown' if git is
// unavailable (e.g. a non-git build environment).
let gitSha = 'unknown'
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // ignore — fall back to 'unknown'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: '/tmp/vite-cache',
  define: {
    __APP_VERSION__: JSON.stringify(gitSha),
  },
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
