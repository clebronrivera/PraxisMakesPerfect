import { createClient } from '@supabase/supabase-js';

// Vite injects `import.meta.env.*` at build/runtime in the browser.
// Our Node-based health/tests import modules directly, so `import.meta.env` may be undefined there.
const viteEnv = (import.meta as any).env as
  | Record<string, string | undefined>
  | undefined;

const supabaseUrl =
  viteEnv?.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  viteEnv?.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

// If we're running under Vite but env vars are missing, fail fast so misconfiguration isn't silent.
if (viteEnv && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Outside Vite (e.g. Node health/tests), provide a disabled client so imports don't crash.
// If code actually calls Supabase in this context, Supabase will fail at runtime and that should be addressed then.
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? '00000000000000000000000000000000'
);
