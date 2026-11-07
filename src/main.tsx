import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';
import { applyDocumentAttributes } from './app/document';
import { registerServiceWorker, unregisterServiceWorkers } from './platform/pwa';
import { getLearnerState } from './state';

// Apply lang / reduced-motion before first paint (avoids a flash of the wrong language attributes).
applyDocumentAttributes(getLearnerState().prefs, getLearnerState().prefs.theme);

const container = document.getElementById('root');
if (!container) throw new Error('Coffee Lab: #root element missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support (PWA): production builds only, registered after load so it never competes with first paint.
// Dev never uses a service worker — and removes one left behind by an earlier `npm run preview` on this origin.
if (import.meta.env.PROD) {
  const register = () => void registerServiceWorker();
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
} else {
  void unregisterServiceWorkers();
}
