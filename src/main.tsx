import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import EventoPublico from './components/EventoPublico.tsx';
import './index.css';

// Detect /e/:slug or /evento/:slug — render public event page without auth
function getPublicSlug(): string | null {
  const m = window.location.pathname.match(/^\/(?:e|evento)\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

const publicSlug = getPublicSlug();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publicSlug ? <EventoPublico slug={publicSlug} /> : <App />}
  </StrictMode>,
);
