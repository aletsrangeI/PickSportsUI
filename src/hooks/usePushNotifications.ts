import { useState, useEffect, useCallback } from 'react';
import {
  useLazyGetVapidPublicKeyQuery,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useSendTestNotificationMutation,
} from '../services/api';

/**
 * Convierte una clave VAPID en Base64 URL-safe a un Uint8Array para pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fetchVapidKey] = useLazyGetVapidPublicKeyQuery();
  const [subscribeBackend] = useSubscribePushMutation();
  const [unsubscribeBackend] = useUnsubscribePushMutation();
  const [sendTestBackend] = useSendTestNotificationMutation();

  // Detectar soporte de navegador al montar
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setIsSubscribed(false);
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (e) {
      console.warn('[usePushNotifications] Error al verificar suscripción existente:', e);
    }
  };

  /**
   * Suscribe al usuario a notificaciones Web Push en 1 clic
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Las notificaciones Push no están soportadas en este navegador/dispositivo.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Solicitar permisos de notificación al navegador
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('El permiso de notificaciones fue denegado por el usuario.');
        setIsLoading(false);
        return false;
      }

      // 2. Registrar el Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Obtener la clave pública VAPID del servidor
      const keyRes = await fetchVapidKey().unwrap();
      const vapidPublicKey = keyRes.data?.publicKey;

      if (!vapidPublicKey) {
        throw new Error('No se pudo obtener la clave pública VAPID del servidor.');
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // 4. Suscribir ante el Push Service del navegador
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint;
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        throw new Error('Faltan claves criptográficas en el objeto de suscripción del navegador.');
      }

      // 5. Registrar en el backend
      const deviceDescription = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} - ${navigator.platform || 'Web'}`;
      await subscribeBackend({
        endpoint,
        p256dhKey: p256dh,
        authKey: auth,
        deviceDescription,
      }).unwrap();

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Error al activar las notificaciones push.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, fetchVapidKey, subscribeBackend]);

  /**
   * Desuscribe de notificaciones Web Push
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await unsubscribeBackend({ endpoint }).unwrap();
        }
      }
      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Error al desactivar notificaciones.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, unsubscribeBackend]);

  /**
   * Envía una notificación de prueba al usuario
   */
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      await sendTestBackend().unwrap();
      return true;
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Error al enviar notificación de prueba.';
      setError(msg);
      return false;
    }
  }, [sendTestBackend]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
