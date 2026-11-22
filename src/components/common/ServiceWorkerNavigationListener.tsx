import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Navega dentro de la SPA cuando el Service Worker lo pide al tocar una notificación.
 * Evita la recarga completa de client.navigate(), que podía cortar un refresh de token
 * en vuelo y cerrar la sesión.
 */
export const ServiceWorkerNavigationListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'NOTIFICATION_NAVIGATE' || typeof event.data.url !== 'string') return;
      const target = new URL(event.data.url, window.location.origin);
      if (target.origin !== window.location.origin) return;
      navigate(`${target.pathname}${target.search}${target.hash}`);
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate]);

  return null;
};
