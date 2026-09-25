import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './styles/global.css';

// Blindaje Anti-Pantalla Blanca: Detección y recuperación automática de chunks obsoletos
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (stale chunks). Forcing page refresh for updated assets.', event);
  const lastReload = sessionStorage.getItem('last_chunk_reload');
  const now = Date.now();
  // Evitar bucle infinito de recargas si el error persiste (margen de 10 segundos)
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('last_chunk_reload', now.toString());
    window.location.reload();
  }
});

// Registro de Service Worker para PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
