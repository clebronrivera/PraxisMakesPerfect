import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import './index.css'

// Check env vars before loading Supabase-dependent modules (avoids blank white page)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const root = document.getElementById('root')!;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:system-ui;padding:24px;">
      <div style="max-width:480px;text-align:center;">
        <h1 style="color:#f87171;font-size:1.5rem;margin-bottom:1rem;">Configuration Error</h1>
        <p style="color:#94a3b8;line-height:1.6;">Missing Supabase environment variables. In Netlify: Site settings → Environment variables, add <code style="background:#1e293b;padding:2px 6px;border-radius:4px;">VITE_SUPABASE_URL</code> and <code style="background:#1e293b;padding:2px 6px;border-radius:4px;">VITE_SUPABASE_ANON_KEY</code>, then trigger a new deploy.</p>
      </div>
    </div>
  `;
} else {
  import('./context/ContentContext').then(({ ContentProvider }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ContentProvider>
          <App />
        </ContentProvider>
      </React.StrictMode>,
    )
  });
}
