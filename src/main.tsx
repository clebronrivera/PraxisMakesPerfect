import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import './index.css'
import { initSentry } from './utils/sentry';

import { ContentProvider } from './context/ContentContext';

// Initialize Sentry before React renders — no-ops when VITE_SENTRY_DSN is absent
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </React.StrictMode>,
)
