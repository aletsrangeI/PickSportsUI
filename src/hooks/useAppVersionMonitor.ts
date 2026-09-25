import { useState, useEffect, useCallback, useRef } from 'react';

export interface VersionInfo {
  version: string;
  buildTime?: string;
  gitCommit?: string;
}

export interface SystemVersionResponse {
  apiVersion: string;
  latestClientVersion: string;
  minSupportedClientVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string | null;
  serverTimeUtc: string;
}

export function compareSemVer(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;
  const clean1 = v1.replace(/^v/i, '').split('-')[0];
  const clean2 = v2.replace(/^v/i, '').split('-')[0];

  const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export const useAppVersionMonitor = () => {
  const localVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isForceUpdateRequired, setIsForceUpdateRequired] = useState<boolean>(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [minSupportedVersion, setMinSupportedVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Referencias para control en closures de eventos del navegador
  const isUpdateAvailableRef = useRef<boolean>(false);
  const isForceUpdateRequiredRef = useRef<boolean>(false);
  const lastCheckTimeRef = useRef<number>(0);

  const applyUpdate = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (err) {
      console.warn('Error enviando SKIP_WAITING al Service Worker:', err);
    }

    // Recarga limpia forzando recarga de recursos
    window.location.reload();
  }, []);

  const checkForUpdates = useCallback(async () => {
    // Throttling: evitar llamadas redundantes en menos de 15 segundos
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 15000) return;
    lastCheckTimeRef.current = now;

    setIsChecking(true);

    let detectedServerVersion: string | null = null;
    let detectedMinVersion: string | null = null;

    // 1. Consultar /version.json estático (directo desde Nginx sin tocar DB)
    try {
      const res = await fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      if (res.ok) {
        const data: VersionInfo = await res.json();
        if (data && data.version) {
          detectedServerVersion = data.version;
        }
      }
    } catch (err) {
      console.debug('No se pudo obtener /version.json:', err);
    }

    // 2. Consultar /api/system/version para versión mínima requerida por backend
    try {
      const res = await fetch(`/api/system/version?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      if (res.ok) {
        const data: SystemVersionResponse = await res.json();
        if (data.latestClientVersion) {
          detectedServerVersion = detectedServerVersion || data.latestClientVersion;
        }
        if (data.minSupportedClientVersion) {
          detectedMinVersion = data.minSupportedClientVersion;
        }
      }
    } catch (err) {
      console.debug('No se pudo obtener /api/system/version:', err);
    }

    setIsChecking(false);

    if (detectedServerVersion) {
      setServerVersion(detectedServerVersion);
    }
    if (detectedMinVersion) {
      setMinSupportedVersion(detectedMinVersion);
    }

    // Evaluar regla de Hard Update (Obligatoria)
    if (detectedMinVersion && compareSemVer(localVersion, detectedMinVersion) < 0) {
      setIsForceUpdateRequired(true);
      isForceUpdateRequiredRef.current = true;
      return;
    }

    // Evaluar regla de Soft Update (Recomendada)
    if (detectedServerVersion && compareSemVer(localVersion, detectedServerVersion) < 0) {
      setIsUpdateAvailable(true);
      isUpdateAvailableRef.current = true;
    }
  }, [localVersion]);

  // Monitoreo inicial y periódico (cada 15 minutos)
  useEffect(() => {
    checkForUpdates();

    const intervalId = setInterval(() => {
      checkForUpdates();
    }, 15 * 60 * 1000); // 15 minutos

    return () => clearInterval(intervalId);
  }, [checkForUpdates]);

  // Monitoreo de visibilidad (móviles/PWA y cambio de pestaña)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Si hay una actualización disponible (no forzada), y la app va a segundo plano,
        // ejecutamos un refresco silencioso automático para que al volver esté actualizada.
        if (isUpdateAvailableRef.current && !isForceUpdateRequiredRef.current) {
          console.info('PickSports en segundo plano con actualización pendiente: aplicando recarga silenciosa.');
          window.location.reload();
        }
      } else if (document.visibilityState === 'visible') {
        // Al regresar del bloqueo de pantalla o de otra app, comprobar si hay actualización
        checkForUpdates();
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates]);

  const dismissUpdate = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    localVersion,
    serverVersion,
    minSupportedVersion,
    isUpdateAvailable: isUpdateAvailable && !isDismissed,
    isForceUpdateRequired,
    isChecking,
    checkForUpdates,
    applyUpdate,
    dismissUpdate
  };
};
