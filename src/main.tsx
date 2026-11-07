import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';
import { applyDocumentAttributes } from './app/document';
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
