/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Injected at build time by vite.config.ts — the short git SHA for the build.
declare const __APP_VERSION__: string
